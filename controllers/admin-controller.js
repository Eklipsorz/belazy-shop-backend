const { accountServices } = require('../services/account-service')
const {
  SUCCESS_CODE,
  SUCCESS_STATUS
} = require('../config/controller').generalSuccess

const adminController = {
  login: (req, res, next) => {
    accountServices.login(req, 'admin', (error, data, message) =>
      error ? next(error) : res.status(SUCCESS_CODE).json({ status: SUCCESS_STATUS, message, data })
    )
  }
}

exports = module.exports = {
  adminController
}
