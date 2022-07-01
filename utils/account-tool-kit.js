const bcrypt = require('bcryptjs')
const validator = require('validator')

const { User } = require('../db/models')

const { ParameterValidationKit } = require('./parameter-validation-kit')
const { AuthToolKit } = require('./auth-tool-kit')

const { code } = require('../config/result-status-table').errorTable
const { blackListRoleIn } = require('../config/app').generalConfig

const {
  RESEND_KEY_PREFIX, RESETPWD_KEY_PREFIX
} = require('../config/app').service.accountService

class AccountToolKit {
  static async loginFormValidate(req, type) {
    let { account } = req.body
    const { password } = req.body

    const { isInvalidFormat } = ParameterValidationKit
    let result = {}

    if (isInvalidFormat(account) || isInvalidFormat(password)) {
      result = { code: code.FORBIDDEN, data: null, message: '未填寫完所有欄位' }
      return { error: true, result }
    }
    req.body.account = account = account.trim()

    const user = await User.findOne({ where: { account } })

    if (!user || blackListRoleIn[type].includes(user.role)) {
      result = { code: code.NOTFOUND, data: null, message: '帳號不存在' }
      return { error: true, result }
    }

    if (!bcrypt.compareSync(password, user.password)) {
      result = { code: code.FORBIDDEN, data: null, message: '帳號或密碼不正確' }
      return { error: true, result }
    }

    result = { code: null, data: user }
    return { error: false, result }
  }

  static async registerFormValidate(req) {
    const messageQueue = []
    const { password, confirmPassword } = req.body
    let { account, nickname, email } = req.body
    const { isInvalidFormat } = ParameterValidationKit
    // 未填寫完所有欄位
    if (
      isInvalidFormat(account) || isInvalidFormat(nickname) ||
      isInvalidFormat(email) || isInvalidFormat(password) ||
      isInvalidFormat(confirmPassword)
    ) {
      messageQueue.push('未填寫完所有欄位')
      return messageQueue
    }

    req.body.nickname = nickname = nickname.trim()
    // 使用者暱稱名稱超過30字
    if (!validator.isLength(nickname, { min: 0, max: 30 })) {
      messageQueue.push('使用者暱稱名稱超過30字')
    }

    req.body.account = account = account.trim()
    // 帳號名稱超過10字
    if (!validator.isLength(account, { min: 0, max: 10 })) {
      messageQueue.push('帳號名稱超過10字')
    }

    req.body.email = email = email.trim()
    // 電子郵件不是正確格式
    if (!validator.isEmail(email)) {
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

    const { password, confirmPassword } = req.body
    let { account, nickname, email } = req.body

    const { isInvalidFormat } = ParameterValidationKit
    // 未填寫完所有欄位
    if (
      isInvalidFormat(account) || isInvalidFormat(nickname) ||
      isInvalidFormat(email) || isInvalidFormat(password) ||
      isInvalidFormat(confirmPassword)
    ) {
      messageQueue.push('未填寫完所有欄位')
      return messageQueue
    }

    req.body.nickname = nickname = nickname.trim()
    // 使用者暱稱名稱超過30字
    if (nickname && !validator.isLength(nickname, { min: 0, max: 30 })) {
      messageQueue.push('使用者暱稱名稱超過30字')
    }

    req.body.account = account = account.trim()
    // 帳號名稱超過10字
    if (account && !validator.isLength(account, { min: 0, max: 10 })) {
      messageQueue.push('帳號名稱超過10字')
    }

    req.body.email = email = email.trim()
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

  static async forgotPasswordFormValidate(req) {
    // check whether account field is empty
    const { isInvalidFormat } = ParameterValidationKit
    let { account } = req.body
    let result = {}
    if (isInvalidFormat(account)) {
      result = { code: code.BADREQUEST, data: req.body, message: '請填寫所有欄位' }
      return { error: true, result }
    }
    req.body.account = account = account.trim()
    const redisClient = req.app.locals.redisClient

    const forgotKey = `${RESEND_KEY_PREFIX}:${account}`

    const cannotResendEmail = await redisClient.get(forgotKey)

    // check whether user can resend a email for verification
    if (cannotResendEmail) {
      result = { code: code.FORBIDDEN, data: req.body, message: '重新發送驗證碼需等待60秒' }
      return { error: true, result }
    }

    // check whether account exists
    const user = await User.findOne({ where: { account, role: 'user' } })
    if (!user) {
      result = { code: code.BADREQUEST, data: req.body, message: '帳號不存在' }
      return { error: true, result }
    }

    result = { data: { user } }
    return { error: false, result }
  }

  static async resetPasswordURLValidate(req) {
    let result = {}
    const { token } = req.query
    const { isInvalidFormat } = ParameterValidationKit

    if (isInvalidFormat(token)) {
      result = { code: code.NOTFOUND, data: null, message: '目前token對應不到任何資料' }
      return { error: true, result }
    }

    const redisClient = req.app.locals.redisClient
    const resetKey = `${RESETPWD_KEY_PREFIX}:${token}`
    const isValidURL = await redisClient.get(resetKey)

    if (!isValidURL) {
      result = { code: code.NOTFOUND, data: null, message: '目前token對應不到任何資料' }
      return { error: true, result }
    }

    return { error: false, result }
  }

  static async resetPasswordFormValidate(req) {
    // check whether the password and checkPassword are valid
    const { password, checkPassword } = req.body
    const { isInvalidFormat } = ParameterValidationKit
    let result = {}

    // check whether the token is valid
    const { token } = req.query

    if (isInvalidFormat(token) || isInvalidFormat(token)) {
      result = { code: code.NOTFOUND, data: null, message: '目前token對應不到任何資料' }
      return { error: true, result }
    }

    const resetKey = `${RESETPWD_KEY_PREFIX}:${token}`
    const redisClient = req.app.locals.redisClient
    const account = await redisClient.get(resetKey)
    console.log('token', token)
    if (!account) {
      result = { code: code.NOTFOUND, data: null, message: '目前token對應不到任何資料' }
      return { error: true, result }
    }

    if (isInvalidFormat(password) || isInvalidFormat(password) ||
      isInvalidFormat(checkPassword) || isInvalidFormat(checkPassword)) {
      result = { code: code.BADREQUEST, data: null, message: '未填寫完所有欄位' }
      return { error: true, result }
    }

    if (password !== checkPassword) {
      result = { code: code.BADREQUEST, data: null, message: '密碼和確認密碼不一致' }
      return { error: true, result }
    }

    // find the user according to the token
    const user = await User.findOne({ where: { account } })
    // return
    result = { data: { user } }
    return { error: false, result }
  }
}

exports = module.exports = {
  AccountToolKit
}
