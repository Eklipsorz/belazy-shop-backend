const { userServices } = require('../services/user-service')
const {
  status,
  code
} = require('../config/result-status-table').successTable

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
  }
}

exports = module.exports = {
  userController
}
