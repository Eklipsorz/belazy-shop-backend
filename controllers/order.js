const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const orderController = {
  postOrders: (req, res, next) => {
    userServices.postOrders(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getOrders: (req, res, next) => {
    userServices.getOrders(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  orderController
}
