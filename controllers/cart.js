const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const cartController = {
  postCarts: (req, res, next) => {
    userServices.postCarts(req, (error, data, message) =>
      error ? next(error) : res.json(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  cartController
}
