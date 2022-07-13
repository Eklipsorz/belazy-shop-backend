
const { code } = require('../../config/result-status-table').errorTable
const { status } = require('../../config/result-status-table').orderStatusTable
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
      status: status.done,
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

  static async getOrderDetails(orders) {
    if (!Array.isArray(orders)) orders = [orders]

    const results = []
    for (const order of orders) {
      const detailOption = {
        where: { orderId: order.id },
        attributes: ['productId', 'price', 'quantity'],
        raw: true
      }
      const orderDetail = await OrderDetail.findAll(detailOption)
      const result = { ...order.toJSON(), products: orderDetail }
      results.push(result)
    }

    return results
  }

  static async getOrders(req, data) {
    const { findOption } = data
    const { page } = req.query
    const orders = await Order.findAll(findOption)
    if (!orders.length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對象項目' })
    }

    const results = await OrderResource.getOrderDetails(orders)

    const resultOrder = results
    return { error: null, data: { currentPage: page, resultOrder }, message: '獲取成功' }
  }

  static async getOrder(req, data) {
    const { findOption } = data

    const order = await Order.findOne(findOption)

    if (!order) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對象項目' })
    }

    const results = await OrderResource.getOrderDetails(order)

    const resultOrder = results
    return { error: null, data: resultOrder, message: '獲取成功' }
  }
}

exports = module.exports = {
  OrderResource
}
