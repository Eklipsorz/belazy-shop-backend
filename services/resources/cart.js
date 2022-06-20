
const { APIError } = require('../../helpers/api-error')
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { CartToolKit } = require('../../utils/cart-tool-kit')
const { status, code } = require('../../config/result-status-table').errorTable
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../../config/app').cache.CART

class CartResource {
  static async getStock(productKeys, cache) {
    const result = {}
    if (!Array.isArray(productKeys)) productKeys = [productKeys]
    for (const key of productKeys) {
      const stockKey = `stock:${key}`
      result[key] = (await cache.hgetall(stockKey))
    }
    return result
  }

  static async checkStockStatus({ cartKeys, cart }, cache) {
    const stock = await CartResource.getStock(cartKeys, cache)
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

  // Get name and image for the product
  static async getProductSnapshots(productKeys, cache) {
    const snapshot = {}

    for (const productKey of productKeys) {
      const key = `product:${productKey}`
      snapshot[productKey] = await cache.hgetall(key)
    }
    return snapshot
  }

  static async getCartRecord(req, sum, type = 'add') {
    const redisClient = req.app.locals.redisClient
    const { cartId } = req.session
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`

    const cart = await redisClient.hgetall(cartKey)

    let isExistCart = false
    let newSum = 0
    switch (type) {
      case 'post':
        isExistCart = Boolean(Object.keys(cart).length) && Boolean(cart.sum !== '0')
        newSum = isExistCart ? Number(cart.sum) + sum : sum
        break
      case 'update':
        isExistCart = true
        newSum = sum
        break
    }

    const template = {
      id: cartId,
      userId: AuthToolKit.getUserId(req),
      sum: newSum,
      createdAt: isExistCart ? new Date(cart.createdAt) : new Date(),
      updatedAt: new Date(),
      dirtyBit: 1,
      refreshAt: isExistCart ? new Date(cart.refreshAt) : RedisToolKit.getRefreshAt(cartKey, new Date())
    }
    return template
  }

  // create a cart to put cartItem: cart.sum = sum
  // put some things into the cart: cart.sum = cart.sum + sum
  // put back some things from the cart: cart.sum = cart.sum - sum
  static async postCart(req, sum) {
    const redisClient = req.app.locals.redisClient
    const { cartId } = req.session
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`

    const template = await CartResource.getCartRecord(req, sum, 'post')
    await redisClient.hset(cartKey, template)
    return template
  }

  // update cart data
  static async putCart(req, sum) {
    const redisClient = req.app.locals.redisClient
    const { cartId } = req.session
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    const template = await CartResource.getCartRecord(req, sum, 'update')

    await redisClient.hset(cartKey, template)
    return template
  }

  // get cart data
  static async getCart(req) {
    try {
      // check whether the cart is empty
      const redisClient = req.app.locals.redisClient
      const { cartId } = req.session
      const cartKey = `${PREFIX_CART_KEY}:${cartId}`

      const cart = await redisClient.hgetall(cartKey)

      const existCart = Boolean(Object.keys(cart).length) && Boolean(cart.sum !== '0')
      if (!existCart) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車是空的' }) }
      }
      // return success message
      const template = {
        id: cart.id,
        userId: cart.userId,
        sum: Number(cart.sum),
        createdAt: new Date(cart.createdAt),
        updatedAt: new Date(cart.updatedAt)
      }
      // ready to check and sync db
      req.stageArea = template

      const resultCart = template
      return { error: null, data: resultCart, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async getCartItems(req) {
    try {
      // check whether there is something in the cart
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const { isEmptyCart, getValidProducts } = CartToolKit
      const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`

      const getCacheValues = RedisToolKit.getCacheValues
      const cart = await getCacheValues(cartKeyPattern, redisClient)

      // if none
      if (isEmptyCart(cart)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車是空的' }) }
      }

      // if yes
      // get all products from the cart
      const products = getValidProducts(cart)
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
      const stock = await redisClient.hgetall(stockKey)

      const template = {
        cartId,
        productId,
        price: Number(stock.price) * quantity,
        quantity,
        createdAt: isExistCart ? new Date(cartItem.createdAt) : new Date(),
        updatedAt: new Date(),
        dirtyBit: 1,
        refreshAt: isExistCart ? new Date(cartItem.refreshAt) : RedisToolKit.getRefreshAt(cartKey, new Date())
      }
      await redisClient.hset(cartKey, template)

      // sync to cart
      const cartTemplate = await CartResource.postCart(req, Number(stock.price))

      // if user has successfully logined, then check refreshAt and dirty
      // ready to check and sync
      req.stageArea = [template, cartTemplate]

      // return success message
      const resultCartItem = { ...template }
      delete resultCartItem.dirtyBit
      delete resultCartItem.refreshAt

      return { error: null, data: resultCartItem, message: '添加成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async putCartItems(req) {
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
      const templates = []
      let sum = 0
      for (const [key, value] of entries) {
        const cartItemKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${key}`
        const total = Number(stock[key].price) * value
        const createdAt = await redisClient.hget(cartItemKey, 'createdAt')
        const refreshAt = await redisClient.hget(cartItemKey, 'refreshAt')
        const template = {
          cartId,
          productId: Number(key),
          quantity: value,
          price: total,
          createdAt: new Date(createdAt),
          updatedAt: new Date(),
          dirtyBit: 1,
          refreshAt: new Date(refreshAt)
        }
        await redisClient.hset(cartItemKey, template)
        templates.push(template)
        sum += total
      }

      // sync to cart
      const cartTemplate = await CartResource.putCart(req, sum)
      // ready to check and sync
      templates.push(cartTemplate)
      req.stageArea = templates

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
      if (!CartToolKit.existCartProduct(cartItem)) {
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
      // sync to cart
      const cartTemplate = await CartResource.postCart(req, -1 * Number(cartItem.price))

      // ready to check and sync
      req.stageArea = [template, cartTemplate]

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
      const { isEmptyCart, getValidProducts } = CartToolKit

      const getCacheValues = RedisToolKit.getCacheValues
      const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
      const cart = await getCacheValues(cartKeyPattern, redisClient)

      // if none, then
      if (isEmptyCart(cart)) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '購物車是空的' }) }
      }

      // if yes, then
      // remove all products with quantity = 0
      const products = getValidProducts(cart)
      const templates = []
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
        templates.push(template)
        await redisClient.hset(cartItemKey, template)
      }
      // sync to cart
      const cartTemplate = await CartResource.putCart(req, 0)

      // ready to check and sync db
      templates.push(cartTemplate)
      req.stageArea = templates

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
