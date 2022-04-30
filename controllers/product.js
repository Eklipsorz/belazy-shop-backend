
const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const productController = {
  getProducts: (req, res, next) => {
    userServices.getProducts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  productController
}
