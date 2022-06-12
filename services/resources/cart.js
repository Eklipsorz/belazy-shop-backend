
const { APIError } = require('../../helpers/api-error')
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { status, code } = require('../../config/result-status-table').errorTable

class CartResource {
  static async checkAndSyncDB(req, cache, { cartKey, productId, cartId, taskType }) {
    const user = AuthToolKit.getUser(req)
    if (user) {
      const option = {
        taskType,
        findOption: {
          where: { productId, cartId }
        }
      }
      await RedisToolKit.syncDBFromCache(cartKey, cache, option)
    }
  }

  static existCartProduct(product) {
    const keys = Object.keys(product)
    // the product is not in the cart
    if (!keys.length || product.quantity === '0') return false
    // the product is in the cart
    return true
  }

  static isEmptyCart(cart) {
    if (!cart.length) return true
    cart.forEach(item => {
      console.log('ans: ', item.productId, item.quantity)
    })
    return cart.every(product => product.quantity === '0')
  }

  static async postCarts(req) {
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

      console.log('isExistCart: ', Boolean(Object.keys(cart).length), Boolean(Number(cart.quantity)))

      const template = {
        cartId,
        productId,
        price: resultStock.price,
        quantity: isExistCart ? Number(cart.quantity) + 1 : 1,
        createdAt: isExistCart ? new Date(cart.createdAt) : new Date(),
        updatedAt: new Date(),
        dirtyBit: isExistCart ? 1 : 0,
        refreshAt: isExistCart ? new Date(cart.refreshAt) : RedisToolKit.getRefreshAt(cartKey, new Date())
      }
      await redisClient.hset(cartKey, template)
      // if user has successfully logined, then check refreshAt and dirty
      const option = { cartKey, productId, cartId, taskType: 'create' }
      await CartResource.checkAndSyncDB(req, redisClient, option)
      // return success message
      const resultCart = { ...template }
      delete resultCart.dirtyBit
      delete resultCart.refreshAt
      return { error: null, data: resultCart, message: '添加成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async deleteProduct(req) {
    try {
      const { productId } = req.body
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const cartKey = `cart:${cartId}:${productId}`

      // check whether product exists in carts
      const cart = await redisClient.hgetall(cartKey)
      // console.log('cart ', cart, Boolean(Number(cart.quantity)))
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

  static async deleteProducts(req) {
    try {
      // check whether there is something inside the cart

      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      console.log('inside products')

      const getCacheValues = RedisToolKit.getCacheValues
      const cartKeyPattern = `cart:${cartId}:*`
      const cart = await getCacheValues(cartKeyPattern, redisClient)
      console.log('delete products: ', cart)
      if (CartResource.isEmptyCart(cart)) {
        console.log('empty')
      }
      // if none, then
      // if yes, then
      // remove all products with quantity = 0
      // return success message
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  CartResource
}
