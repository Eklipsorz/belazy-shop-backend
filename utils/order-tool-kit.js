const { ParameterValidationKit } = require('../utils/parameter-validation-kit')
const { code } = require('../config/result-status-table').errorTable
class OrderToolKit {
  static checkReceiver(req) {
    const { isInvalidFormat } = ParameterValidationKit
    const { receiverName, receiverPhone, receiverAddr } = req.body
    let result = {}
    if (
      isInvalidFormat(receiverName) ||
      isInvalidFormat(receiverPhone) ||
      isInvalidFormat(receiverAddr)
    ) {
      result = { code: code.BADREQUEST, message: '未填寫完收件人欄位' }
      return { error: true, result }
    }

    return { error: false, result }
  }
}

exports = module.exports = {
  OrderToolKit
}
