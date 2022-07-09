const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { APIError } = require('../../helpers/api-error')
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { GeneralResourceValidator } = require('./general-resource-validator')
const { code } = require('../../config/result-status-table').errorTable

class OrderResourceValidator {
  static isInvalidReceiver(req) {
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

  static postOrders(req) {
    GeneralResourceValidator.isInvalidReceiver(req)
    GeneralResourceValidator.isValidRequirement(req)
    const resultData = null
    return { data: resultData }
  }
}

exports = module.exports = {
  OrderResourceValidator
}
