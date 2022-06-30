const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const userController = {
  login: (req, res, next) => {
    userServices.login(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  register: (req, res, next) => {
    userServices.register(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getSelf: (req, res, next) => {
    userServices.getSelf(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  putSelf: (req, res, next) => {
    userServices.putSelf(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  postForgotPassword: (req, res, next) => {
    userServices.postForgotPassword(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  getResetPassword: (req, res, next) => {
    userServices.getResetPassword(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  userController
}
