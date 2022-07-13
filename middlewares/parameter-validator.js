
const { parameterValidator } = require('../config/app').middleware
const { ParameterValidationKit } = require('../utils/parameter-validation-kit')
const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')

class ParameterValidator {
  static searchParameterValidate(req, _, next) {
    const { keyword, by } = req.query
    const { AVABILABLE_BY_OPTION } = parameterValidator
    const { isInvalidFormat } = ParameterValidationKit
    const matchingType = by?.toLowerCase()

    if (isInvalidFormat(keyword)) {
      return next(new APIError({ code: code.BADREQUEST, status, message: '關鍵字為空' }))
    }

    // check whether by is empty
    if (isInvalidFormat(by)) {
      return next(new APIError({ code: code.BADREQUEST, status, message: 'by參數為空' }))
    }

    // check whether by is correct
    if (!AVABILABLE_BY_OPTION.includes(matchingType)) {
      return next(new APIError({ code: code.BADREQUEST, status, message: 'by參數為錯誤' }))
    }
    req.query.by = matchingType
    return next()
  }

  static existURIValidate(req, _, next) {
    const URIParams = req.params
    const { isNumberString } = ParameterValidationKit

    const isExistURI = Object.values(URIParams).every(key => isNumberString(key))

    if (isExistURI) {
      return next()
    }
    return next(new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }))
  }
}
exports = module.exports = {
  ParameterValidator
}
