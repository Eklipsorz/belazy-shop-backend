const { adminServices } = require('../services/admin-service')
const {
  status,
  code
} = require('../config/result-status-table').successTable

const adminController = {
  login: (req, res, next) => {
    adminServices.login(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  adminController
}
