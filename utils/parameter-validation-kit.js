const validator = require('validator')
const { MAX_LENGTH_CONTENT, MIN_LENGTH_CONTENT } = require('../config/app').service.replyResource

class ParameterValidationKit {
  static isNaN(value) {
    const number = Number(value)
    return number !== value
  }

  static isFilledField(field) {
    const string = String(field)
    return string !== ''
  }

  static isString(value) {
    const string = String(value)
    return string === value
  }

  static isNumberString(value) {
    const number = Number(value)
    return String(number) === value
  }

  static isDateString(value) {
    const { isNumberString } = ParameterValidationKit
    if (isNumberString(value)) return false
    return Boolean(Date.parse(value))
  }

  static replyContentValidate(req) {
    const messageQueue = []
    const { content } = req.body
    const minLength = MIN_LENGTH_CONTENT
    const maxLength = MAX_LENGTH_CONTENT

    if (!validator.isLength(content, { min: minLength, max: maxLength })) {
      messageQueue.push(`留言字數範圍得為：${minLength} - ${maxLength} 字`)
    }
    return messageQueue
  }

  static updateStockValidate(req) {
    const messageQueue = []
    const { quantity, restQuantity, price } = req.body
    const { isNaN, isFilledField } = ParameterValidationKit

    if (!isFilledField(quantity) || !isFilledField(restQuantity) || !isFilledField(price)) {
      messageQueue.push('所有欄位都要填寫')
    }

    if (isNaN(quantity) || isNaN(restQuantity) || isNaN(price)) {
      messageQueue.push('所有欄位都必須是數字')
      return messageQueue
    }

    if (price <= 0) messageQueue.push('產品價格要大於0')
    if (quantity < 0) messageQueue.push('產品庫存量只能是正值')
    if (restQuantity < 0) messageQueue.push('剩餘庫存數量只能是正值')
    if (restQuantity > quantity) messageQueue.push('剩餘量必須小於數量')

    return messageQueue
  }
}

exports = module.exports = {
  ParameterValidationKit
}
