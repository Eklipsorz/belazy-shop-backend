const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { GeneralResourceValidator } = require('./general-resource-validator')
const { code } = require('../../config/result-status-table').errorTable
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { APIError } = require('../../helpers/api-error')
const { User } = require('../../db/models')

class OrderResourceValidator {
  static async postOrders(req) {
    // check whether buyer is valid
    const { isInvalidFormat } = ParameterValidationKit
    const { buyerAccount } = req.body

    if (isInvalidFormat(buyerAccount)) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應買家' })
    }
    const findOption = {
      where: { account: buyerAccount }
    }
    const buyer = await User.findOne(findOption)

    if (!buyer) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應買家' })
    }
    // check whether receiver is valid
    GeneralResourceValidator.checkReceiver(req)
    // check whether product requirement is valid
    await GeneralResourceValidator.checkProductRequirement(req)

    const resultData = buyer
    return { data: resultData }
  }
}

exports = module.exports = {
  OrderResourceValidator
}
