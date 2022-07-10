const { code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')

class BadURLFilter {
  static continuousSlashDectect(req) {
    const URL = req.originalUrl
    const regexRule = /^.*\/{2,}/g
    const isInvalid = URL.match(regexRule)

    return Boolean(isInvalid)
  }

  static preDetect(req, _, next) {
    let isInvalid = false
    isInvalid = BadURLFilter.continuousSlashDectect(req)

    if (isInvalid) {
      return next(new APIError({ code: code.NOTFOUND, message: '找不到對應項目' }))
    }

    return next()
  }

  static postDetect(req, _, next) {
    return next(new APIError({ code: code.NOTFOUND, message: '找不到對應服務' }))
  }
}

exports = module.exports = {
  BadURLFilter
}
