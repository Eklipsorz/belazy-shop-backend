
const { code } = require('../../config/result-status-table').errorTable
const { APIError } = require('../../helpers/api-error')
const { Order, OrderDetail } = require('../../db/models')

class OrderResource {
  static async postOrders(req) {
    // create a order (including order_details and orders)
    // create a order
    // id, userId, sum, status, receiverName, receiverPhone, receiverAddr

    // create some order_details records to the order
    // id, orderId, productId, productName, price, quantity
    // success
    const resultOrder = null
    return { error: null, data: resultOrder, message: '訂單建立成功' }
  }
}

exports = module.exports = {
  OrderResource
}
