
const { APIError } = require('../../helpers/api-error')
const { RedisToolKit } = require('../../utils/redis-tool-kit')

const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')

const { status, code } = require('../../config/result-status-table').errorTable

class CartResource {
  static getProducts(cart) {
    const resultProducts = cart.filter(product => Number(product.quantity) > 0)
    return resultProducts
  }

  static async getStock(productKeys, cache) {
    const result = {}
    for (const key of productKeys) {
      const stockKey = `stock:${key}`
      result[key] = (await cache.hgetall(stockKey))
    }
    return result
  }

  static existCartProduct(product) {
    const keys = Object.keys(product)
    // the product is not in the cart
    if (!keys.length || product.quantity === '0') return false
    // the product is in the cart
    return true
  }

  // Get name and image for the product
  static async getProductSnapshot(product, cache) {
    const productId = product.productId
    const productKey = `product:${productId}`
    const result = await cache.hgetall(productKey)

    const template = { ...product, ...result }
    if (template.dirtyBit) delete template.dirtyBit
    if (template.refreshAt) delete template.refreshAt
    return template
  }

  static isEmptyCart(cart) {
    if (!cart.length) return true
    return cart.every(product => product.quantity === '0')
  }

  static async delProductTask({ cartId, productId }, cache) {
    const key = `cart:${cartId}:${productId}`
    return cache.hset(key, 'quantity', 0)
  }

  static async getCartItems(req) {
    try {
      // check whether there is something in the cart
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const { isEmptyCart, getProducts } = CartResource
      const cartKeyPattern = `cart:${cartId}:*`

      const getCacheValues = RedisToolKit.getCacheValues
      const cart = await getCacheValues(cartKeyPattern, redisClient)

      // if none
      if (isEmptyCart(cart)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車是空的' }) }
      }

      // if yes
      // get all products from the cart
      const products = getProducts(cart)
      const getProductSnapshot = CartResource.getProductSnapshot
      const resultCart = await Promise
        .all(
          products.map(product => getProductSnapshot(product, redisClient))
        )

      // ready to check and sync
      req.stageArea = cart

      // return success message
      return { error: null, data: resultCart, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async postCartItems(req) {
    try {
      const { productId } = req.body
      const redisClient = req.app.locals.redisClient
      const productKey = `product:${productId}`
      const stockKey = `stock:${productId}`

      // check whether product exists in product
      const product = await redisClient.hgetall(productKey)
      // nothing
      if (!Object.keys(product).length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }
      // I've found that
      // check whether the stock is enough
      const stock = await redisClient.hgetall(stockKey)
      const resultStock = {
        ...stock,
        productId: Number(stock.productId),
        quantity: Number(stock.quantity),
        restQuantity: Number(stock.restQuantity),
        price: Number(stock.price)
      }

      // if not enough, just say sorry and return
      if (resultStock.restQuantity <= 0) {
        return { error: new APIError({ code: code.BADREQUEST, status, message: '產品已完售' }) }
      }
      // if enough, just create or update a cart data in cache

      const { cartId } = req.session
      const cartKey = `cart:${cartId}:${productId}`
      const cart = await redisClient.hgetall(cartKey)
      const isExistCart = Boolean(Object.keys(cart).length) && Boolean(Number(cart.quantity))

      const quantity = isExistCart ? Number(cart.quantity) + 1 : 1

      const template = {
        cartId,
        productId,
        price: resultStock.price * quantity,
        quantity,
        createdAt: isExistCart ? new Date(cart.createdAt) : new Date(),
        updatedAt: new Date(),
        dirtyBit: isExistCart ? 1 : 0,
        refreshAt: isExistCart ? new Date(cart.refreshAt) : RedisToolKit.getRefreshAt(cartKey, new Date())
      }
      await redisClient.hset(cartKey, template)
      // if user has successfully logined, then check refreshAt and dirty
      // ready to check and sync
      req.stageArea = template
      // return success message
      const resultCart = { ...template }
      delete resultCart.dirtyBit
      delete resultCart.refreshAt
      return { error: null, data: resultCart, message: '添加成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async putCart(req) {
    try {
      const redisClient = req.app.locals.redisClient
      const { cartId } = req.session
      const cartHashMap = req.body
      const { isNaN } = ParameterValidationKit
      const entries = Object.entries(cartHashMap)
      const keys = entries.map(([key, _]) => key)

      async function ExistenceTest(keys, cache) {
        for (const key of keys) {
          const result = await cache.hgetall(key)
          if (result.quantity === '0') return false
          if (!Object.keys(result).length) return false
        }
        return true
      }

      // check whether one of products is not inside the cart
      const cartKeys = keys.map(item => `cart:${cartId}:${item}`)
      const areValidProducts = await ExistenceTest(cartKeys, redisClient)
      if (!areValidProducts) {
        return { error: new APIError({ code: code.NOTFOUND, message: '購物車內找不到對應項目', data: cartHashMap }) }
      }

      // check whether one of products has invalid quantity:
      // - quantity is NaN?
      // - quantity is greater than 0?
      const values = entries.map(([_, value]) => Number(value))
      const areValidNumbers = values.every(value => !isNaN(value))
      if (!areValidNumbers) {
        return { error: new APIError({ code: code.BADREQUEST, message: '購買數量必須是數字', data: cartHashMap }) }
      }

      const areGreaterThanZero = values.every(value => Number(value) > 0)
      if (!areGreaterThanZero) {
        return { error: new APIError({ code: code.BADREQUEST, message: '數量必須至少是1以上', data: cartHashMap }) }
      }

      const stock = await CartResource.getStock(keys, redisClient)

      // check whether stock is enough?
      const areEnoughStock = entries.every(([productId, quantity]) => {
        const restQuantity = Number(stock[productId].restQuantity)
        return restQuantity > Number(quantity)
      })
      if (!areEnoughStock) {
        return { error: new APIError({ code: code.BADREQUEST, message: '購買量是高於庫存量', data: cartHashMap }) }
      }

      // All is ok, then buy some goods
      const results = []
      for (const [key, value] of entries) {
        const cartKey = `cart:${cartId}:${key}`
        const total = Number(stock[key].price) * value
        await redisClient.hset(cartKey, 'quantity', value)
        await redisClient.hset(cartKey, 'price', total)
        await redisClient.hset(cartKey, 'dirtyBit', 1)
        await redisClient.hset(cartKey, 'updatedAt', new Date())
        results.push(await redisClient.hgetall(cartKey))
      }

      // ready to check and sync
      req.stageArea = results

      const resultCart = null
      return { error: null, data: resultCart, message: '修改成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async deleteCartItem(req) {
    try {
      const { productId } = req.body
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const cartKey = `cart:${cartId}:${productId}`

      // check whether product exists in carts
      const cart = await redisClient.hgetall(cartKey)

      // nothing
      if (!CartResource.existCartProduct(cart)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車內找不到對應項目' }) }
      }

      // I've found that
      // remove that product with quantity = 0
      await redisClient.hset(cartKey, 'quantity', 0)
      // if user has successfully logined, then check refreshAt and dirty
      const resultCart = {
        cartId,
        productId,
        price: Number(cart.price),
        createdAt: new Date(cart.createdAt),
        updatedAt: new Date(cart.updatedAt)
      }
      // return success message
      return { error: null, data: resultCart, message: '移除成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async deleteCart(req) {
    try {
      // check whether there is something inside the cart
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const { isEmptyCart, getProducts, delProductTask } = CartResource

      const getCacheValues = RedisToolKit.getCacheValues
      const cartKeyPattern = `cart:${cartId}:*`
      const cart = await getCacheValues(cartKeyPattern, redisClient)

      // if none, then
      if (isEmptyCart(cart)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車是空的' }) }
      }

      // if yes, then
      // remove all products with quantity = 0
      const products = getProducts(cart)

      await Promise.all(
        products.map(product => delProductTask(product, redisClient))
      )

      // return success message
      const resultCart = null
      return { error: null, data: resultCart, message: '移除成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  CartResource
}
