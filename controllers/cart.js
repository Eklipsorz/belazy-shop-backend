const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const cartController = {
  getCartItems: (req, res, next) => {
    userServices.getCartItems(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
  postCartItems: (req, res, next) => {
    userServices.postCartItems(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
  putCartItems: (req, res, next) => {
    userServices.putCartItems(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
  deleteCartItem: (req, res, next) => {
    userServices.deleteCartItem(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  deleteCart: (req, res, next) => {
    userServices.deleteCart(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  cartController
}
