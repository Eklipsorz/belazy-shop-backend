
const { ParameterValidationKit } = require('./parameter-validation-kit')
const { code } = require('../config/result-status-table').errorTable

class ProductToolKit {
  static async updateStockValidate(req) {
    const messageQueue = []
    const { quantity, restQuantity, price } = req.body
    const { isNaN, isFilledField } = ParameterValidationKit

    const { productId } = req.params
    const redisClient = req.app.locals.redisClient
    const stocktKey = `stock:${productId}`

    const product = await redisClient.hgetall(stocktKey)
    let result = {}

    const isExistProductInCache = Boolean(Object.keys(product).length)

    if (!isExistProductInCache) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應項目' }
      return { error: true, result }
    }

    if (!isFilledField(quantity) || !isFilledField(restQuantity) || !isFilledField(price)) {
      messageQueue.push('所有欄位都要填寫')
    }

    if (isNaN(quantity) || isNaN(restQuantity) || isNaN(price)) {
      messageQueue.push('所有欄位都必須是數字')
      result = { code: code.BADREQUEST, data: req.body, message: messageQueue }
      return { error: true, result }
    }

    if (price <= 0) messageQueue.push('產品價格要大於0')
    if (quantity <= 0) messageQueue.push('產品庫存量要大於0')
    if (restQuantity <= 0) messageQueue.push('剩餘庫存數量要大於0')
    if (restQuantity > quantity) messageQueue.push('剩餘量必須小於數量')

    if (messageQueue.length) {
      result = { code: code.BADREQUEST, data: req.body, message: messageQueue }
      return { error: true, result }
    }

    result = { code: null, data: product }
    return { error: false, result }
  }
}

exports = module.exports = {
  ProductToolKit
}
