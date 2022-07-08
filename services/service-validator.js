const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { APIError } = require('../helpers/api-error')
const { ProductToolKit } = require('../utils/product-tool-kit')
const { CartToolKit } = require('../utils/cart-tool-kit')
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { ParameterValidationKit } = require('../utils/parameter-validation-kit')
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

  static async postPagePurchase(req) {
    return ServiceValidator.postPurchase(req)
  }

  static async postCartPurchase(req) {
    return ServiceValidator.postPurchase(req)
  }

  static async postPurchase(req) {
    const redisClient = req.app.locals.redisClient
    const { isInvalidFormat } = ParameterValidationKit
    const { items, stripeToken } = req.body
    // check whether token and items fields are filled?
    if (isInvalidFormat(stripeToken)) {
      throw new APIError({ code: code.FORBIDDEN, message: '目前付款資訊無法正常付款' })
    }

    if (isInvalidFormat(items)) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }

    // check whether syntax of items field is valid?
    const { quantityHashMapSyntaxValidate } = ProductToolKit
    const syntaxValidation = quantityHashMapSyntaxValidate(items)
    if (syntaxValidation.error) {
      const { result } = syntaxValidation
      throw new APIError({ code: result.code, message: result.message })
    }

    // check whether products are exist?
    const { existProductsValidate, getQuantityHashMap } = ProductToolKit
    const quantityHashMap = getQuantityHashMap(items)
    const keys = Object.keys(quantityHashMap)
    const existValidation = await existProductsValidate(keys, redisClient)
    if (existValidation.error) {
      const { result } = existValidation
      throw new APIError({ code: result.code, message: result.message })
    }

    const resultData = { quantityHashMap }
    return { data: resultData }
  }
}

exports = module.exports = {
  ServiceValidator
}
