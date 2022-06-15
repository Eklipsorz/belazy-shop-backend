const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../config/app').cache.CART

class CartPostprocessor {
  static async checkAndSyncDBTask(product, cache) {
    const { cartId, productId } = product
    const option = {
      taskType: 'update',
      findOption: {
        where: { productId, cartId }
      }
    }
    const cartKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`

    await RedisToolKit.syncDBFromCache(cartKey, cache, option)
  }

  static async checkAndSyncDB(req, _, next) {
    try {
      const stageArea = Array.isArray(req.stageArea) ? req.stageArea : [req.stageArea]
      // console.log('stageArea', stageArea)
      const redisClient = req.app.locals.redisClient
      const checkAndSyncDBTask = CartPostprocessor.checkAndSyncDBTask
      await Promise.all(
        stageArea.map(product => checkAndSyncDBTask(product, redisClient))
      )
    } catch (error) {
      return next(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }
}

exports = module.exports = {
  CartPostprocessor
}
