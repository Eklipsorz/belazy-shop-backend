const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../config/app').cache.CART

class CartPostprocessor {
  static async checkAndSyncDBTask(item, cache) {
    let option = {}
    let itemKey = ''

    const type = item.productId ? 'cart_item' : 'cart'
    console.log('current type', type)
    switch (type) {
      case 'cart_item': {
        const { cartId, productId } = item
        option = {
          taskType: 'update',
          findOption: {
            where: { productId, cartId }
          }
        }
        itemKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
        console.log('cart_item', itemKey, option)
        break
      }
      case 'cart': {
        const { id } = item
        option = {
          taskType: 'update',
          findOption: {
            where: { id }
          }
        }
        itemKey = `${PREFIX_CART_KEY}:${id}`
        console.log('cart', itemKey, option)
        break
      }
      default:
    }

    await RedisToolKit.syncDBFromCache(itemKey, cache, option)
  }

  static async checkAndSyncDB(req, _, next) {
    try {
      const stageArea = Array.isArray(req.stageArea) ? req.stageArea : [req.stageArea]
      console.log('hi', stageArea)
      // console.log('stageArea', stageArea)
      const redisClient = req.app.locals.redisClient
      const checkAndSyncDBTask = CartPostprocessor.checkAndSyncDBTask
      await Promise.all(
        stageArea.map(item => checkAndSyncDBTask(item, redisClient))
      )
    } catch (error) {
      return next(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }
}

exports = module.exports = {
  CartPostprocessor
}
