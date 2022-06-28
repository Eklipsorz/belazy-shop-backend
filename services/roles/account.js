const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { FileUploader } = require('../../middlewares/file-uploader')
const { AccountToolKit } = require('../../utils/account-tool-kit')
const { EmailToolKit } = require('../../utils/email-tool-kit')

const { User } = require('../../db/models')
const {
  DEFAULT_BCRYPT_COMPLEXITY, DEL_OPERATION_CODE,
  DEFAULT_AVATAR, RESET_TOKEN_LENGTH,
  RESEND_TIME_LIMIT, RESET_PASSWORD_TIME_LIMIT,
  RESEND_KEY_PREFIX, RESETPWD_KEY_PREFIX
} = require('../../config/app').service.accountService

class AccountService {
  constructor(serviceType) {
    this.serviceType = serviceType
  }

  async login(req, cb) {
    try {
      const type = this.serviceType
      const { error, result } = await AccountToolKit.loginFormValidate(req, type)

      if (error) {
        return cb(new APIError({ code: result.code, data: result.data, message: result.message }))
      }

      const resultUser = result.data.toJSON()
      const accessToken = AuthToolKit.generateAccessToken(resultUser)
      delete resultUser.password
      return cb(null, { accessToken, ...resultUser }, '登入成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }

  async register(req, cb) {
    try {
      const message = await AccountToolKit.registerFormValidate(req)
      if (message.length > 0) {
        return cb(new APIError({ code: code.BADREQUEST, message, data: req.body }))
      }
      const { nickname, email, account, password } = req.body

      await User.create({
        nickname,
        email,
        account,
        role: 'user',
        password: bcrypt.hashSync(password, DEFAULT_BCRYPT_COMPLEXITY),
        avatar: 'https://res.cloudinary.com/dqfxgtyoi/image/upload/v1650818850/belazy-shop/Avatar_n1jfi9.png'
      })

      return cb(null, null, '註冊成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }

  async putSelf(req, cb) {
    try {
      const user = AuthToolKit.getUser(req)
      const message = await AccountToolKit.updateFormValidate(req)

      if (message.length > 0) {
        return cb(new APIError({ code: code.BADREQUEST, message, data: req.body }))
      }

      const { nickname, email, account, password, avatar } = req.body
      const { file } = req
      const destType = 'cloudStorage'
      let uploadAvatar = ''

      if (avatar === DEL_OPERATION_CODE) {
        uploadAvatar = DEFAULT_AVATAR
      } else {
        uploadAvatar = file
          ? await FileUploader.upload(file, destType)
          : user.avatar
      }

      await User.update({
        nickname,
        email,
        account,
        password: bcrypt.hashSync(password, DEFAULT_BCRYPT_COMPLEXITY),
        avatar: uploadAvatar
      }, { where: { id: user.id } })

      const resultUser = { ...req.body, avatar: uploadAvatar }
      delete resultUser.password
      delete resultUser.confirmPassword

      return cb(null, resultUser, '修改成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }

  async getSelf(req, cb) {
    try {
      const resultUser = AuthToolKit.getUser(req)
      delete resultUser.password
      return cb(null, resultUser, '獲取成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }

  async postForgotPassword(req, cb) {
    try {
      const { error, result } = await AccountToolKit.forgotPasswordFormValidate(req)
      if (error) {
        return cb(new APIError({ code: result.code, data: result.data, message: result.message }))
      }

      // hashing with account
      const { user } = result.data
      const token = crypto.randomBytes(RESET_TOKEN_LENGTH).toString('base64')
      // create a key:value to resend email and set expireAt
      const redisClient = req.app.locals.redisClient
      const resendKey = `${RESEND_KEY_PREFIX}:${user.account}`
      await redisClient.set(resendKey, token)
      await redisClient.expire(resendKey, RESEND_TIME_LIMIT)

      // create a key:value to verify email and set expireAt
      const resetKey = `${RESETPWD_KEY_PREFIX}:${token}`
      await redisClient.set(resetKey, user.account)
      await redisClient.expire(resetKey, RESET_PASSWORD_TIME_LIMIT)

      // send email
      const option = { req, subject: '重設密碼', receiver: user, token }
      await EmailToolKit.sendSupportEmail(option)
      const resultAccount = null
      return cb(null, resultAccount, '申請成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }
}

exports = module.exports = {
  AccountService
}
