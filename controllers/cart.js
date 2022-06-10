const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const cartController = {
  postCarts: (req, res, next) => {
    userServices.postCarts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  deleteProduct: (req, res, next) => {
    userServices.deleteProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  cartController
}
