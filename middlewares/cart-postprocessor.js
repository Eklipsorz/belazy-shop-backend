const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { Cart } = require('../db/models')
const { RedisToolKit } = require('../utils/redis-tool-kit')

class CartPostprocessor {
  // a task template for synchronizing db
  static async syncDBTask(product) {
    const { cartId, productId } = product

    const template = {
      cartId,
      price: Number(product.price),
      quantity: Number(product.quantity),
      productId: Number(productId),
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    }

    const findOption = {
      where: { cartId, productId },
      defaults: template
    }
    // create a record if there is nothing about cartId and productId
    // update the record if there is a cart data with cartId and productId
    const [cart, created] = await Cart.findOrCreate(findOption)
    if (!created) await cart.update(product)
  }

  // check expire and dirty
  // if true, update
  // if false, do nothing
  static async syncCartFromCachetoDB(req) {
    console.log('stageArea: ', req.stageArea)
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient
    // const keyPattern = `cart:${cartId}:*`
    const stageArea = req.stageArea

    const syncDBTask = CartPostprocessor.syncDBTask
    const cart = await RedisToolKit.getCacheValues(keyPattern, redisClient)

    return await Promise.all(
      cart.map(syncDBTask)
    )
  }
}

exports = module.exports = {
  CartPostprocessor
}
