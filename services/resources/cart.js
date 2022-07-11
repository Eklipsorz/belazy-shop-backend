
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
  static async getCart(req, data) {
    const cart = data
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
  }

  // get all cartItems from current cart
  static async getCartItems(req, data) {
    // if yes
    // get all products from the cart
    const cart = data

    const results = CartToolKit.getValidProducts(cart)
    const { page, offset, limit, order } = req.query
    let products = []

    switch (order) {
      case 'DESC': {
        const compare = (a, b) => (Date.parse(b.createdAt) - Date.parse(a.createdAt))
        products = results.sort(compare)
        break
      }
      case 'ASC': {
        const compare = (a, b) => (Date.parse(a.createdAt) - Date.parse(b.createdAt))
        products = results.sort(compare)
        break
      }
    }

    products = products.slice(offset, limit + offset)
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
    return { error: null, data: { currentPage: page, resultCart }, message: '獲取成功' }
  }

  // add a product into current cart
  static async postCartItems(req, data) {
    const redisClient = req.app.locals.redisClient
    const { productId } = req.body
    const { cartId } = req.session
    const { stockHashMap, cartItem } = data
    const cartKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`

    const isExistCart = Boolean(Object.keys(cartItem).length) && Boolean(Number(cartItem.quantity))
    const quantity = isExistCart ? Number(cartItem.quantity) + 1 : 1

    // if enough, just create or update a cart data in cache
    const unitPrice = Number(stockHashMap[productId].price)

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
  }

  // update a cartItem inside current cart
  static async putCartItems(req, data) {
    const redisClient = req.app.locals.redisClient
    const { cartId } = req.session
    const { stockHashMap, cartHashMap } = data
    const entries = Object.entries(cartHashMap)
    //  All is ok, then buy some goods
    const templates = []
    let sum = 0
    for (const [id, quantity] of entries) {
      const cartItemKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${id}`
      const total = Number(stockHashMap[id].price) * quantity
      const createdAt = await redisClient.hget(cartItemKey, 'createdAt')
      const refreshAt = await redisClient.hget(cartItemKey, 'refreshAt')
      const template = {
        cartId,
        productId: Number(id),
        quantity: quantity,
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
  }

  // remove a product from current cart
  static async deleteCartItem(req, data) {
    const { productId } = req.body
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient
    const cartItemKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
    const cartItem = data

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
  }

  // remove all products from current cart
  static async deleteCart(req, data = null) {
    // req.session.cartId = '5bbd8cf9-0656-4126-b7fc-1b5ace445883'
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    let cart = data
    if (!cart) {
      const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
      cart = await RedisToolKit.getCacheValues(cartKeyPattern, redisClient)
    }

    const products = CartToolKit.getValidProducts(cart)

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
