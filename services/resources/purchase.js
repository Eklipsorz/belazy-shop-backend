const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable

class PurchaseResource {
  static async postPurchase(req) {
    try {
      const resultPurchase = null
      return { error: null, data: resultPurchase, message: '購買成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, message: error.message }) }
    }
  }
}

exports = module.exports = {
  PurchaseResource
}
