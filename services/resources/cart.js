
const { APIError } = require('../../helpers/api-error')
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { CartToolKit } = require('../../utils/cart-tool-kit')
const { ProductToolKit } = require('../../utils/product-tool-kit')
const { status, code } = require('../../config/result-status-table').errorTable
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../../config/app').cache.CART

class CartResource {
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

  // add/remove price of product to/from current cart
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

  // update sum to cart
  static async putCart(req, sum) {
    const redisClient = req.app.locals.redisClient
    const { cartId } = req.session
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    const template = await CartResource.getCartRecord(req, sum, 'update')

    await redisClient.hset(cartKey, template)
    return template
  }

  // get cart info from current cart
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

  // get all cartItems from current cart
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

      const template = []

      for (const product of products) {
        template.push({
          ...product
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

  // add a product into current cart
  static async postCartItems(req) {
    try {
      const { productId } = req.body
      const redisClient = req.app.locals.redisClient
      const productKey = `product:${productId}`

      const { error, result } = CartToolKit.cartItemSyntaxValidate(req)
      if (error) {
        return { error: new APIError({ code: result.code, status, message: result.message }) }
      }
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

      const { getStock, checkStockStatus } = ProductToolKit
      const stock = await getStock(productId, redisClient)
      const { soldOut, notEnough } = await checkStockStatus(cartHashMap, stock)
      const stockError = Boolean(soldOut.length) || Boolean(notEnough.length)

      // if not enough, just say sorry and return
      if (stockError) {
        return { error: new APIError({ code: code.BADREQUEST, data: { soldOut, notEnough }, message: '庫存問題' }) }
      }

      // if enough, just create or update a cart data in cache
      const unitPrice = Number(stock[productId].price)

      const template = {
        cartId,
        productId,
        price: unitPrice * quantity,
        quantity,
        createdAt: isExistCart ? new Date(cartItem.createdAt) : new Date(),
        updatedAt: new Date(),
        dirtyBit: 1,
        refreshAt: isExistCart ? new Date(cartItem.refreshAt) : RedisToolKit.getRefreshAt(cartKey, new Date())
      }
      await redisClient.hset(cartKey, template)

      // sync to cart
      const cartTemplate = await CartResource.postCart(req, unitPrice)

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

  // update a cartItem inside current cart
  static async putCartItems(req) {
    try {
      const { isUndefined } = ParameterValidationKit
      const redisClient = req.app.locals.redisClient
      const { cartId } = req.session
      const { items } = req.body
      const defaultData = isUndefined(items) ? null : JSON.stringify(items)
      const cart = items

      const { error, result } = ProductToolKit.quantityHashMapSyntaxValidate(cart)
      if (error) {
        return { error: new APIError({ code: result.code, message: result.message, data: defaultData }) }
      }

      const cartHashMap = ProductToolKit.getQuantityHashMap(cart)

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
        return { error: new APIError({ code: code.NOTFOUND, message: '購物車內找不到對應項目', data: defaultData }) }
      }

      //  check whether stock is enough?
      const { getStock, checkStockStatus } = ProductToolKit
      const stock = await getStock(keys, redisClient)
      const { soldOut, notEnough } = checkStockStatus(cartHashMap, stock)
      const stockError = Boolean(soldOut.length) || Boolean(notEnough.length)

      if (stockError) {
        return { error: new APIError({ code: code.BADREQUEST, data: { soldOut, notEnough }, message: '庫存問題' }) }
      }

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
      return { error: new APIError({ code: code.SERVERERROR, message: error.message }) }
    }
  }

  // remove a product from current cart
  static async deleteCartItem(req) {
    try {
      const { productId } = req.body
      const { cartId } = req.session

      const { error, result } = CartToolKit.cartItemSyntaxValidate(req)
      if (error) {
        return { error: new APIError({ code: result.code, status, message: result.message }) }
      }

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

  // remove all products from current cart
  static async deleteCart(req, data = null) {
    req.session.cartId = '93c1b1fc-9af4-4020-8e07-d83f028b3d20'
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    let cart = data
    if (!cart) {
      const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
      cart = await RedisToolKit.getCacheValues(cartKeyPattern, redisClient)
      console.log('cartId, cartKey', cartId, cartKeyPattern)
    }

    const products = CartToolKit.getValidProducts(cart)
    console.log('product', products, data)
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
  }
}

exports = module.exports = {
  CartResource
}
