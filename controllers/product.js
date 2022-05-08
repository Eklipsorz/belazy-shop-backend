
const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const productController = {
  getProducts: (req, res, next) => {
    userServices.getProducts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getProduct: (req, res, next) => {
    userServices.getProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getSearchHints: (req, res, next) => {
    userServices.getSearchHints(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  searchProduct: (req, res, next) => {
    userServices.searchProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  searchCategory: (req, res, next) => {
    console.log('hi this product controller')
    userServices.searchCategory(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  productController
}
