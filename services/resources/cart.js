
const { APIError } = require('../../helpers/api-error')
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { status, code } = require('../../config/result-status-table').errorTable
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../../config/app').cache.CART

class CartResource {
  static getProducts(cart) {
    const resultProducts = cart.filter(product => Number(product.quantity) > 0)
    return resultProducts
  }

  static async getStock(productKeys, cache) {
    const result = {}
    if (!Array.isArray(productKeys)) productKeys = [productKeys]
    for (const key of productKeys) {
      const stockKey = `stock:${key}`
      result[key] = (await cache.hgetall(stockKey))
    }
    return result
  }

  // const findOption = { cartKeys: keys, cart: cartHashMap, snapshots }
  // const message = await CartResource.checkStockStatus(findOption, redisClient)
  static async checkStockStatus({ cartKeys, cart }, cache) {
    const stock = await this.getStock(cartKeys, cache)
    const snapshots = await CartResource.getProductSnapshots(cartKeys, cache)
    const messages = []

    for (const key of cartKeys) {
      const restQuantity = Number(stock[key].restQuantity)
      const productName = snapshots[key].name
      switch (true) {
        case (!restQuantity):
          messages.push(`${productName} 已售罄`)
          break
        case (Number(cart[key]) > restQuantity):
          messages.push(`${productName} 購買量大於庫存量`)
          break
      }
    }

    return messages
  }

  static existCartProduct(product) {
    const keys = Object.keys(product)
    // the product is not in the cart
    if (!keys.length || product.quantity === '0') return false
    // the product is in the cart
    return true
  }

  // Get name and image for the product
  static async getProductSnapshots(productKeys, cache) {
    const snapshot = {}

    for (const productKey of productKeys) {
      const key = `product:${productKey}`
      snapshot[productKey] = await cache.hgetall(key)
    }
    return snapshot
  }

  static isEmptyCart(cart) {
    if (!cart.length) return true
    return cart.every(product => product.quantity === '0')
  }

  static async getCartItems(req) {
    try {
      // check whether there is something in the cart
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const { isEmptyCart, getProducts } = CartResource
      const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`

      const getCacheValues = RedisToolKit.getCacheValues
      const cart = await getCacheValues(cartKeyPattern, redisClient)

      // if none
      if (isEmptyCart(cart)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車是空的' }) }
      }

      // if yes
      // get all products from the cart
      const products = getProducts(cart)
      const productKeys = products.map(product => product.productId)
      const snapshots = await CartResource.getProductSnapshots(productKeys, redisClient)

      const template = []
      for (const product of products) {
        const { productId } = product
        template.push({
          ...product,
          name: snapshots[productId].name,
          image: snapshots[productId].image
        })
      }

      // ready to check and sync
      req.stageArea = products

      // return success message
      const resultCart = template
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

      // const findOption = { cartKeys: keys, cart: cartHashMap }

      // const message = await CartResource.checkStockStatus(findOption, redisClient)
      // // check whether stock is enough?

      // if (message.length) {
      //   return { error: new APIError({ code: code.BADREQUEST, message, data: cartHashMap }) }
      // }

      const { cartId } = req.session
      const cartKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
      const cartItem = await redisClient.hgetall(cartKey)
      const isExistCart = Boolean(Object.keys(cartItem).length) && Boolean(Number(cartItem.quantity))

      const quantity = isExistCart ? Number(cartItem.quantity) + 1 : 1

      const cartHashMap = {}
      cartHashMap[productId] = quantity
      const findOption = { cartKeys: [productId], cart: cartHashMap }
      const message = await CartResource.checkStockStatus(findOption, redisClient)

      // if not enough, just say sorry and return
      if (message.length) {
        return { error: new APIError({ code: code.BADREQUEST, status, message }) }
      }

      // if enough, just create or update a cart data in cache

      const template = {
        cartId,
        productId,
        price: resultStock.price * quantity,
        quantity,
        createdAt: isExistCart ? new Date(cartItem.createdAt) : new Date(),
        updatedAt: new Date(),
        dirtyBit: isExistCart ? 1 : 0,
        refreshAt: isExistCart ? new Date(cartItem.refreshAt) : RedisToolKit.getRefreshAt(cartKey, new Date())
      }
      await redisClient.hset(cartKey, template)
      // if user has successfully logined, then check refreshAt and dirty
      // ready to check and sync
      req.stageArea = template

      // return success message
      const resultCartItem = { ...template }
      delete resultCartItem.dirtyBit
      delete resultCartItem.refreshAt

      return { error: null, data: resultCartItem, message: '添加成功' }
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
      const cartKeys = keys.map(item => `${PREFIX_CARTITEM_KEY}:${cartId}:${item}`)
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

      const findOption = { cartKeys: keys, cart: cartHashMap }

      const message = await CartResource.checkStockStatus(findOption, redisClient)
      // check whether stock is enough?

      if (message.length) {
        return { error: new APIError({ code: code.BADREQUEST, message, data: cartHashMap }) }
      }

      const stock = await CartResource.getStock(keys, redisClient)
      //  All is ok, then buy some goods
      const results = []
      for (const [key, value] of entries) {
        const cartKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${key}`
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
      const cartItemKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`

      // check whether product exists in carts
      const cartItem = await redisClient.hgetall(cartItemKey)

      // nothing
      if (!CartResource.existCartProduct(cartItem)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車內找不到對應項目' }) }
      }

      // I've found that
      // remove that product with quantity = 0
      const template = {
        ...cartItem,
        quantity: 0,
        price: 0,
        dirtyBit: 1,
        updatedAt: new Date()
      }

      await redisClient.hset(cartItemKey, template)

      // if user has successfully logined, then check refreshAt and dirty
      const resultCartItem = null
      // return success message
      return { error: null, data: resultCartItem, message: '移除成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async deleteCart(req) {
    try {
      // check whether there is something inside the cart
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const { isEmptyCart, getProducts } = CartResource

      const getCacheValues = RedisToolKit.getCacheValues
      const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
      const cart = await getCacheValues(cartKeyPattern, redisClient)

      // if none, then
      if (isEmptyCart(cart)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車是空的' }) }
      }

      // if yes, then
      // remove all products with quantity = 0
      const products = getProducts(cart)
      for (const product of products) {
        const { productId } = product
        const cartItemKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
        const template = {
          ...product,
          quantity: 0,
          price: 0,
          dirtyBit: 1,
          updatedAt: new Date()
        }
        await redisClient.hset(cartItemKey, template)
      }

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
