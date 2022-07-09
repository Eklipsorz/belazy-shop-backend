
const { code } = require('../../config/result-status-table').errorTable
const { APIError } = require('../../helpers/api-error')

class OrderResource {
  static async postOrders(req) {
    const resultOrder = null
    return { error: null, data: resultOrder, message: '訂單建立成功' }
  }
}

exports = module.exports = {
  OrderResource
}
