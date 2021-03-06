const { userServices } = require('../services/roles/user')
const { status, code } = require('../config/result-status-table').successTable

const replyController = {
  getReply: (req, res, next) => {
    userServices.getReply(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  deleteReply: (req, res, next) => {
    userServices.deleteReply(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  },
  putReply: (req, res, next) => {
    userServices.putReply(req, (error, data, message) =>
      error ? next(error) : res.status(code.OK).json({ status, message, data })
    )
  }
}

exports = module.exports = {
  replyController
}
