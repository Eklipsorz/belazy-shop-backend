
const { code } = require('../../config/result-status-table').errorTable
const { APIError } = require('../../helpers/api-error')
const { Order, OrderDetail } = require('../../db/models')

class OrderResource {
  static async postOrders(req, data) {
    const { receiverName, receiverPhone, receiverAddr, items } = req.body
    const { sum, user, stockHashMap } = data

    // create a order (including order_details and orders)
    // create a order
    // id, userId, sum, status, receiverName, receiverPhone, receiverAddr
    const orderOption = {
      userId: user.id,
      sum: Number(sum),
      status: 'done',
      receiverName,
      receiverPhone,
      receiverAddr
    }
    const order = await Order.create(orderOption)

    // create some order_details records to the order
    // id, orderId, productId, productName, price, quantity
    for (const item of items) {
      const { productId, quantity } = item
      const { price } = stockHashMap[productId]

      const detailOption = {
        orderId: order.id,
        productId: Number(productId),
        quantity: Number(quantity),
        price: Number(price) * Number(quantity)
      }
      await OrderDetail.create(detailOption)
    }

    // success
    const resultOrder = null
    return { error: null, data: resultOrder, message: '訂單建立成功' }
  }
}

exports = module.exports = {
  OrderResource
}
