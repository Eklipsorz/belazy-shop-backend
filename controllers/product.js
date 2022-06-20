
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

  getProductSnapshot: (req, res, next) => {
    userServices.getProductSnapshot(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },

  getStock: (req, res, next) => {
    userServices.getStock(req, (error, data, message) =>
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
  },
  getReplies: (req, res, next) => {
    userServices.getReplies(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  postReplies: (req, res, next) => {
    userServices.postReplies(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  productController
}
