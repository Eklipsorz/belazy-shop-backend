const bcrypt = require('bcryptjs')
const { APIError } = require('../helpers/api-error-helper')
const { generateAccessToken } = require('../helpers/jwt-helper')
const { registerFormValidator, updateFormValidator } = require('../helpers/formdata-check-helper')
const { User } = require('../db/models')
const { status, code } = require('../config/result-status-table').errorTable
const { getUser, getUserId } = require('../helpers/auth-helper')
const { ImgurFileHandler } = require('../helpers/file-upload-helper')

const {
  blackListRoleIn
} = require('../config/project').generalConfig

const DEFAULT_BCRYPT_COMPLEXITY = 10

class AccountService {
  constructor(serviceType) {
    this.serviceType = serviceType
  }

  async login(req, cb) {
    try {
      const { account, password } = req.body
      const type = this.serviceType

      if (!account || !password) {
        return cb(new APIError({ code: code.FORBIDDEN, status, message: '未填寫完所有欄位' }))
      }
      const user = await User.findOne({ where: { account } })

      if (!user || blackListRoleIn[type].includes(user.role)) {
        return cb(new APIError({ code: code.NOTFOUND, status, message: '帳號不存在' }))
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return cb(new APIError({ code: code.FORBIDDEN, status, message: '帳號或密碼不正確' }))
      }
      const resultUser = user.toJSON()
      const accessToken = generateAccessToken(resultUser)
      delete resultUser.password
      return cb(null, { accessToken, ...resultUser }, '登入成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }

  async register(req, cb) {
    try {
      const message = await registerFormValidator(req)
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
      const id = getUserId(req)
      const message = await updateFormValidator(req)
      if (message.length > 0) {
        return cb(new APIError({ code: code.BADREQUEST, message, data: req.body }))
      }
      const { nickname, email, account, password } = req.body
      const { file } = req
      ImgurFileHandler(file)
      await User.update({
        nickname,
        email,
        account,
        password: bcrypt.hashSync(password, DEFAULT_BCRYPT_COMPLEXITY)
        // avatar:
      }, { where: { id } })

      const resultUser = req.body
      delete resultUser.password
      delete resultUser.confirmPassword

      return cb(null, resultUser, '修改成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }

  async getSelf(req, cb) {
    try {
      const resultUser = getUser(req)
      delete resultUser.password
      return cb(null, resultUser, '獲取成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }
}

exports = module.exports = {
  AccountService
}
