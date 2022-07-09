const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { APIError } = require('../../helpers/api-error')

const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { GeneralResourceValidator } = require('./general-resource-validator')

const { code } = require('../../config/result-status-table').errorTable

class PurchaseResourceValidator {
  static async postPagePurchase(req) {
    const { isInvalidFormat } = ParameterValidationKit
    const { stripeToken } = req.body
    // check whether receiver info is valid
    GeneralResourceValidator.isInvalidReceiver(req)

    // check whether token and items fields are filled?
    if (isInvalidFormat(stripeToken)) {
      throw new APIError({ code: code.FORBIDDEN, message: '目前付款資訊無法正常付款' })
    }
    return GeneralResourceValidator.isValidRequirement(req)
  }

  static async postCartPurchase(req) {
    const { isInvalidFormat } = ParameterValidationKit
    const { stripeToken } = req.body
    // check whether receiver info is valid
    GeneralResourceValidator.isInvalidReceiver(req)

    // check whether token and items fields are filled?
    if (isInvalidFormat(stripeToken)) {
      throw new APIError({ code: code.FORBIDDEN, message: '目前付款資訊無法正常付款' })
    }

    return GeneralResourceValidator.isValidRequirement(req)
  }
}

exports = module.exports = {
  PurchaseResourceValidator
}
