const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { APIError } = require('../../helpers/api-error')
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { code } = require('../../config/result-status-table').errorTable
const { ProductToolKit } = require('../../utils/product-tool-kit')

class GeneralResourceValidator {
  // check whether receiver info is valid

  static checkReceiver(req) {
    const { isInvalidFormat } = ParameterValidationKit
    const { receiverName, receiverPhone, receiverAddr } = req.body
    if (
      isInvalidFormat(receiverName) ||
      isInvalidFormat(receiverPhone) ||
      isInvalidFormat(receiverAddr)
    ) {
      throw new APIError({ code: code.BADREQUEST, message: '未填寫完收件人欄位' })
    }
  }

  // check whether items which buyer is buying are valid?
  static async checkProductRequirement(req) {
    const redisClient = req.app.locals.redisClient
    const { isInvalidFormat } = ParameterValidationKit
    const { items } = req.body

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
  GeneralResourceValidator
}
