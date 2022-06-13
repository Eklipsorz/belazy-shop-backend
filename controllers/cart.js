const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const cartController = {
  getCart: (req, res, next) => {
    userServices.getCart(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
  postCarts: (req, res, next) => {
    userServices.postCarts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
  deleteProduct: (req, res, next) => {
    userServices.deleteProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  deleteProducts: (req, res, next) => {
    userServices.deleteProducts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  cartController
}
