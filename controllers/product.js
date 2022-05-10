
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

  likeProduct: (req, res, next) => {
    userServices.likeProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },

  unlikeProduct: (req, res, next) => {
    userServices.unlikeProduct(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },

  getSearchHints: (req, res, next) => {
    userServices.getSearchHints(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  searchProducts: (req, res, next) => {
    userServices.searchProducts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },

  searchProductsFromCategory: (req, res, next) => {
    userServices.searchProductsFromCategory(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  productController
}
