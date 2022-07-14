const { ParameterValidationKit } = require('../utils/parameter-validation-kit')
const { ProductToolKit } = require('../utils/product-tool-kit')
const { User } = require('../db/models')
const { code } = require('../config/result-status-table').errorTable
class OrderToolKit {
  static checkReceiver(req) {
    const { isInvalidFormat } = ParameterValidationKit
    const { receiverName, receiverPhone, receiverAddr } = req.body
    let result = {}
    if (
      isInvalidFormat(receiverName) ||
      isInvalidFormat(receiverPhone) ||
      isInvalidFormat(receiverAddr)
    ) {
      result = { code: code.BADREQUEST, message: '未填寫完收件人欄位' }
      return { error: true, result }
    }

    return { error: false, result }
  }

  static async postOrdersValidate(req) {
    // check whether buyer is valid
    const { isInvalidFormat } = ParameterValidationKit
    const { buyerAccount } = req.body
    let result = {}

    if (isInvalidFormat(buyerAccount)) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應買家' }
      return { error: true, result }
    }

    const findOption = {
      where: { account: buyerAccount }
    }
    const buyer = await User.findOne(findOption)
    if (!buyer) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應買家' }
      return { error: true, result }
    }

    // check whether receiver is valid
    const receiverValidate = OrderToolKit.checkReceiver(req)
    if (receiverValidate.error) {
      const { result } = receiverValidate
      return { error: true, result }
    }

    // check whether product requirement is valid
    const requirementValidate = await ProductToolKit.checkProductRequirement(req)
    if (requirementValidate.error) {
      const { result } = requirementValidate
      return { error: true, result }
    }

    // calculate the sum
    const { items } = req.body
    let sum = 0
    for (const item of items) {
      const { productId, quantity } = item
      const totalPrice = await ProductToolKit.getProductTotalPrice(req, productId, quantity)
      sum += totalPrice
    }

    // transfer items into stockHashMap
    const redisClient = req.app.locals.redisClient
    const keys = items.map(item => item.productId)
    const stockHashMap = await ProductToolKit.getStock(keys, redisClient)

    const resultData = { user: buyer, sum, stockHashMap }
    return { error: false, result: { data: resultData } }
  }
}

exports = module.exports = {
  OrderToolKit
}
