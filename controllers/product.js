const { adminServices } = require('../services/roles/admin')
const { status, code } = require('../config/result-status-table').successTable

const productController = {
  getProducts: (req, res, next) => {
    adminServices.getProducts(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  productController
}
