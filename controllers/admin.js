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
    adminServices.getProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  postProducts: (req, res, next) => {
    adminServices.postProducts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getStock: (req, res, next) => {
    adminServices.getStock(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  putStock: (req, res, next) => {
    adminServices.putStock(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getCategory: (req, res, next) => {
    adminServices.getCategory(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getCategories: (req, res, next) => {
    adminServices.getCategories(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getProductsFromCategory: (req, res, next) => {
    adminServices.getProductsFromCategory(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getProductsFromCategories: (req, res, next) => {
    adminServices.getProductsFromCategories(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  adminController
}
