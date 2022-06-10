const validator = require('validator')
const { User } = require('../db/models')
const { AuthToolKit } = require('./auth-tool-kit')
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

  static async registerFormValidate(req) {
    const messageQueue = []
    const {
      account, nickname,
      email, password,
      confirmPassword
    } = req.body

    const { isFilledField } = ParameterValidationKit
    // 未填寫完所有欄位
    if (
      !isFilledField(account) || !isFilledField(nickname) ||
      !isFilledField(email) || !isFilledField(password) ||
      !isFilledField(confirmPassword)
    ) {
      messageQueue.push('未填寫完所有欄位')
    }
    // 使用者暱稱名稱超過30字
    if (nickname && !validator.isLength(nickname, { min: 0, max: 30 })) {
      messageQueue.push('使用者暱稱名稱超過30字')
    }

    // 帳號名稱超過10字
    if (account && !validator.isLength(account, { min: 0, max: 10 })) {
      messageQueue.push('帳號名稱超過10字')
    }

    // 電子郵件不是正確格式
    if (email && !validator.isEmail(email)) {
      messageQueue.push('電子郵件不是正確格式')
    }

    // 密碼和確認密碼不一致
    if (password !== confirmPassword) {
      messageQueue.push('密碼和確認密碼不一致')
    }

    // 電子郵件重複註冊
    if ((await User.findOne({ where: { email } }))) {
      messageQueue.push('電子郵件重複註冊')
    }

    // 帳號重複註冊
    if ((await User.findOne({ where: { account } }))) {
      messageQueue.push('帳號重複註冊')
    }

    // 暱稱重複註冊
    if ((await User.findOne({ where: { nickname } }))) {
      messageQueue.push('暱稱重複註冊')
    }
    return messageQueue
  }

  static async updateFormValidate(req) {
    const messageQueue = []
    const currentUserId = AuthToolKit.getUserId(req)

    const {
      account, nickname,
      email, password,
      confirmPassword
    } = req.body

    const { isFilledField } = ParameterValidationKit
    // 未填寫完所有欄位
    if (
      !isFilledField(account) || !isFilledField(nickname) ||
      !isFilledField(email) || !isFilledField(password) ||
      !isFilledField(confirmPassword)
    ) {
      messageQueue.push('未填寫完所有欄位')
    }

    // 使用者暱稱名稱超過30字
    if (nickname && !validator.isLength(nickname, { min: 0, max: 30 })) {
      messageQueue.push('使用者暱稱名稱超過30字')
    }

    // 帳號名稱超過10字
    if (account && !validator.isLength(account, { min: 0, max: 10 })) {
      messageQueue.push('帳號名稱超過10字')
    }

    // 電子郵件不是正確格式
    if (email && !validator.isEmail(email)) {
      messageQueue.push('電子郵件不是正確格式')
    }

    // 密碼和確認密碼不一致
    if (password !== confirmPassword) {
      messageQueue.push('密碼和確認密碼不一致')
    }

    // 確認電子郵件、帳號、暱稱
    const [resultByEmail, resultByAccount, resultByNickname] = await Promise.all([
      User.findOne({ where: { email } }),
      User.findOne({ where: { account } }),
      User.findOne({ where: { nickname } })
    ])

    // 電子郵件重複註冊
    if (resultByEmail && currentUserId !== resultByEmail.id) {
      messageQueue.push('電子郵件重複註冊')
    }

    // 帳號重複註冊
    if (resultByAccount && currentUserId !== resultByAccount.id) {
      messageQueue.push('帳號重複註冊')
    }

    // 暱稱重複註冊
    if (resultByNickname && currentUserId !== resultByNickname.id) {
      messageQueue.push('暱稱重複註冊')
    }
    return messageQueue
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
