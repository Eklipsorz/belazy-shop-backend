const bcrypt = require('bcryptjs')
const { APIError } = require('../helpers/api-error-helper')
const { generateAccessToken } = require('../helpers/jwt-helper')
const { User } = require('../db/models')
const {
  status,
  code
} = require('../config/result-status-table').errorTable

const {
  blackListRoleIn
} = require('../config/service').accountService

const accountServices = {
  login: async (req, type, cb) => {
    try {
      const { account, password } = req.body

      if (!account || !password) {
        return cb(new APIError({ code: code.FORBIDDEN, status, message: '未填寫完所有欄位' }))
      }

      const user = await User.findOne({ where: { account }, raw: true })

      if (!user || blackListRoleIn[type].includes(user.role)) {
        return cb(new APIError({ code: code.NOTFOUND, status, message: '帳號不存在' }))
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return cb(new APIError({ code: code.FORBIDDEN, status, message: '帳號或密碼不正確' }))
      }
      const resultUser = user
      const accessToken = generateAccessToken(resultUser)
      return cb(null, { accessToken, ...resultUser }, '登入成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }
}

exports = module.exports = {
  accountServices
}
