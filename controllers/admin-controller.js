const { accountServices } = require('../services/account-service')
const {
  status,
  code
} = require('../config/result-status-table').successTable

const adminController = {
  login: (req, res, next) => {
    accountServices.login(req, 'admin', (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  adminController
}
