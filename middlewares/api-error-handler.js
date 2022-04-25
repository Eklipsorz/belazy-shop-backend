
const {
  DEFAULT_CODE,
  DEFAULT_MESSAGE,
  DEFAULT_STATUS,
  DEFAULT_DATA
} = require('../config/middleware').APIErrorHandler

const { code } = require('../config/result-status-table').errorTable
function APIErrorHandler(error, _, res, next) {
  const errorCode = error.code || DEFAULT_CODE
  const message = error.message || DEFAULT_MESSAGE
  const status = error.status || DEFAULT_STATUS
  const data = error.data || DEFAULT_DATA

  switch (error.code) {
    case code.BADREQUEST:
    case code.UNAUTHORIZED:
    case code.FORBIDDEN:
    case code.NOTFOUND:
    case code.SERVERERROR:
      res.status(errorCode).json({ status, message, data })
      break
  }
  next(error)
}

exports = module.exports = {
  APIErrorHandler
}
