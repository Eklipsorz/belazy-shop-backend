const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const cartController = {
  getCart: (req, res, next) => {
    userServices.getCart(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
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
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
  deleteCart: (req, res, next) => {
    userServices.deleteCart(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data }) && next()
    )
  },
  postCartPurchase: (req, res, next) => {
    userServices.postCartPurchase(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  cartController
}
