
const { APIError } = require('../../helpers/api-error')
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { status, code } = require('../../config/result-status-table').errorTable

class CartResource {
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
      const isExistCart = Boolean(Object.keys(cart).length)

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
      const user = AuthToolKit.getUser(req)

      if (user) {
        const findOption = {
          where: { productId, cartId }
        }
        await RedisToolKit.syncDBFromCache(cartKey, redisClient, findOption)
      }
      // return success message
      const resultCart = { ...template }
      delete resultCart.dirtyBit
      delete resultCart.refreshAt
      return { error: null, data: resultCart, message: '添加成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  CartResource
}
