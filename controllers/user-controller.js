const { accountServices } = require('../services/account-service')
const {
  status,
  code
} = require('../config/result-status-table').successTable

const userController = {
  login: (req, res, next) => {
    accountServices.login(req, 'users', (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  register: (req, res, next) => {
    accountServices.register(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  userController
}
