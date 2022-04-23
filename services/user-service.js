const bcrypt = require('bcryptjs')
const { APIError } = require('../helpers/api-error-helper')
const { generateAccessToken } = require('../helpers/jwt-helper')
const { User } = require('../db/models')

const userServices = {
  login: async (req, cb) => {
    const { account, password } = req.body

    try {
      if (!account || !password) {
        return cb(new APIError({ code: 403, status: 'error', message: '未填寫完所有欄位' }))
      }

      const user = await User.findOne({ where: { account }, raw: true })

      if (!user || user !== 'admin') {
        return cb(new APIError({ code: 404, status: 'error', message: '帳號不存在' }))
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return cb(new APIError({ code: 403, status: 'error', message: '帳號或密碼不正確' }))
      }
      const resultUser = user
      const accessToken = generateAccessToken(resultUser)

      return cb(null, '登入成功', { accessToken, ...resultUser })
    } catch (error) {
      return cb(new APIError({ code: 500, message: error.message }))
    }
  }
}

exports = module.exports = {
  userServices
}
