const { userServices } = require('../services/user-service')
const {
  SUCCESS_CODE,
  SUCCESS_STATUS
} = require('../config/controller').userController

const userController = {
  login: (req, res, next) => {
    userServices.login(req, (error, message, data) =>
      error ? next(error) : res.status(SUCCESS_CODE).json({ status: SUCCESS_STATUS, message, data })
    )
  }
}

exports = module.exports = userController
