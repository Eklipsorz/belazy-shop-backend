
const {
  DEFAULT_CODE,
  DEFAULT_MESSAGE,
  DEFAULT_STATUS,
  DEFAULT_DATA
} = require('../config/middleware').APIErrorHandler

function APIErrorHandler(error, _, res, next) {
  const code = error.code || DEFAULT_CODE
  const message = error.message || DEFAULT_MESSAGE
  const status = error.status || DEFAULT_STATUS
  const data = error.data || DEFAULT_DATA

  switch (error.code) {
    case 400:
    case 401:
    case 403:
    case 404:
    case 500:
      res.status(code).json({ status, message, data })
      break
  }
  next(error)
}

exports = module.exports = {
  APIErrorHandler
}
