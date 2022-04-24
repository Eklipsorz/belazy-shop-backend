const { status, code } = require('./result-status-table').errorTable

const APIErrorHandler = {
  DEFAULT_STATUS: status,
  DEFAULT_CODE: code.SERVERERROR,
  DEFAULT_MESSAGE: '系統出錯',
  DEFAULT_DATA: null
}

exports = module.exports = {
  APIErrorHandler
}
