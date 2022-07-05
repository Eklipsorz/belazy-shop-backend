
const {
  DEFAULT_CODE,
  DEFAULT_MESSAGE,
  DEFAULT_STATUS,
  DEFAULT_DATA
} = require('../config/app').middleware.APIErrorHandler

const { code } = require('../config/result-status-table').errorTable
function APIErrorHandler(error, _, res, next) {
  const errorCode = error.code || DEFAULT_CODE
  const message = error.message || DEFAULT_MESSAGE
  const status = DEFAULT_STATUS
  const data = error.data || DEFAULT_DATA

  switch (errorCode) {
    case code.BADREQUEST:
    case code.UNAUTHORIZED:
    case code.FORBIDDEN:
    case code.NOTFOUND:
    case code.SERVERERROR:
      return res.status(errorCode).json({ status, message, data })
  }
  return next(error)
}

exports = module.exports = {
  APIErrorHandler
}
