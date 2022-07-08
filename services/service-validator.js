const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { APIError } = require('../helpers/api-error')
const { CartToolKit } = require('../utils/cart-tool-kit')
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { PREFIX_CARTITEM_KEY } = require('../config/app').cache.CART

const { code } = require('../config/result-status-table').errorTable

class ServiceValidator {
  static async deleteCart(req) {
    // check whether there is something inside the cart

    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
    const cart = await RedisToolKit.getCacheValues(cartKeyPattern, redisClient)

    // if none, then
    if (CartToolKit.isEmptyCart(cart)) {
      throw new APIError({ code: code.NOTFOUND, message: '購物車是空的' })
    }

    const resultData = cart
    return { data: resultData }
  }
}

exports = module.exports = {
  ServiceValidator
}
