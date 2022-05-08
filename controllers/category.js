const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const categoryController = {
  getCategory: (req, res, next) => {
    console.log('controller getCategory')
    userServices.getCategory(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getCategories: (req, res, next) => {
    userServices.getCategories(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getProductsFromCategory: (req, res, next) => {
    userServices.getProductsFromCategory(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getProductsFromCategories: (req, res, next) => {
    console.log('categories controller')
    userServices.getProductsFromCategories(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }

}

exports = module.exports = {
  categoryController
}
