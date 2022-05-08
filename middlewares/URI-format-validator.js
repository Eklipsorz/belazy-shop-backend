
const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
function ExistURIValidator(req, _, next) {
  const URIParams = req.params
  const isExistURI = Object.values(URIParams).every(key => !isNaN(key))

  if (isExistURI) {
    return next()
  }
  return next(new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }))
}

exports = module.exports = {
  ExistURIValidator
}
