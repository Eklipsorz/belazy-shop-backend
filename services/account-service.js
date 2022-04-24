const bcrypt = require('bcryptjs')
const { APIError } = require('../helpers/api-error-helper')
const { generateAccessToken } = require('../helpers/jwt-helper')
const { User } = require('../db/models')
const {
  FORBIDDEN,
  NOTFOUND,
  SERVERERROR
} = require('../config/service').generalErrorCode

const {
  blackListRoleIn
} = require('../config/service').accountService

const accountServices = {
  login: async (req, type, cb) => {
    const { account, password } = req.body

    try {
      if (!account || !password) {
        return cb(new APIError({ code: FORBIDDEN, status: 'error', message: '未填寫完所有欄位' }))
      }

      const user = await User.findOne({ where: { account }, raw: true })

      if (!user || blackListRoleIn[type].includes(user.role)) {
        return cb(new APIError({ code: NOTFOUND, status: 'error', message: '帳號不存在' }))
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return cb(new APIError({ code: FORBIDDEN, status: 'error', message: '帳號或密碼不正確' }))
      }
      const resultUser = user
      const accessToken = generateAccessToken(resultUser)
      return cb(null, { accessToken, ...resultUser }, '登入成功')
    } catch (error) {
      return cb(new APIError({ code: SERVERERROR, message: error.message }))
    }
  }
}

exports = module.exports = {
  accountServices
}
