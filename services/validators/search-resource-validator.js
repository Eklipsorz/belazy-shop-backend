const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })
const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')

class SearchResourceValidator {
  static getSearchHints(req) {
    const { keyword } = req.query
    const { isInvalidFormat } = ParameterValidationKit

    if (isInvalidFormat(keyword)) {
      throw new APIError({ code: code.BADREQUEST, message: '關鍵字為空' })
    }

    const resultData = null
    return { data: resultData }
  }
}

exports = module.exports = {
  SearchResourceValidator
}
