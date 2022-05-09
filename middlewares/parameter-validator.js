
const { parameterValidator } = require('../config/app').middleware
const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')

class ParameterValidator {
  static queryStringValidate(req, _, next) {
    const { keyword, by } = req.query
    const { AVABILABLE_BY_OPTION } = parameterValidator
    const matchingType = by?.toLowerCase()

    if (!keyword) {
      return next(new APIError({ code: code.BADREQUEST, status, message: '關鍵字為空' }))
    }

    // check whether by is empty
    if (!by) {
      return next(new APIError({ code: code.BADREQUEST, status, message: 'by參數為空' }))
    }

    // check whether by is correct
    if (!AVABILABLE_BY_OPTION.includes(matchingType)) {
      return next(new APIError({ code: code.BADREQUEST, status, message: 'by參數為錯誤' }))
    }
    req.query.by = matchingType
    return next()
  }
}
exports = module.exports = {
  ParameterValidator
}
