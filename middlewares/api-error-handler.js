
function APIErrorHandler(error, _, res, next) {
  const DEFAULT_STATUS = 'error'
  const DEFAULT_CODE = 500
  const DEFAULT_MESSAGE = '系統出錯'
  const DEFAULT_DATA = null

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
