const { adminServices } = require('../services/roles/admin')
const { status, code } = require('../config/result-status-table').successTable

const adminController = {
  login: (req, res, next) => {
    adminServices.login(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getSelf: (req, res, next) => {
    adminServices.getSelf(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  putSelf: (req, res, next) => {
    adminServices.putSelf(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getProducts: (req, res, next) => {
    adminServices.getProducts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getProduct: (req, res, next) => {
    console.log('hasdsa')
    adminServices.getProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  adminController
}