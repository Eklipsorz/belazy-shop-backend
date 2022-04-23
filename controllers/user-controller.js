const bcrypt = require('bcryptjs')
const { userServices } = require('../services/user-service')
const BCRYPT_COMPLEXITY = 10

const userController = {
  login: (req, res, next) => {
    userServices.login(req, (error, data) =>
      error ? next(error) : res.status(200).json({ status: 'success', data })
    )
  }
}

exports = module.exports = userController
