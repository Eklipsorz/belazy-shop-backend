const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { GeneralResourceValidator } = require('./general-resource-validator')
const { code } = require('../../config/result-status-table').errorTable

class OrderResourceValidator {
  static async postOrders(req) {
    GeneralResourceValidator.isInvalidReceiver(req)
    await GeneralResourceValidator.isValidRequirement(req)
    const resultData = null
    return { data: resultData }
  }
}

exports = module.exports = {
  OrderResourceValidator
}
