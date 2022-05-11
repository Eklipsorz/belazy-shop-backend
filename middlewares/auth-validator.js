const passport = require('../config/passport')
const { AuthToolKit } = require('../utils/auth-tool-kit')
const { blackListRoleIn } = require('../config/app').generalConfig
const { code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')

class AuthValidator {
  static authenticate(req, res, next) {
    function cb(error, user) {
      if (!error && user) req.user = user
      return next()
    }

    const verify = passport.authenticate('jwt', { session: false }, cb)
    verify(req, res, next)
  }

  static authenticateLoggedIn(req, _, next) {
    const user = req?.user
    if (!user) {
      return next(new APIError({ code: code.UNAUTHORIZED, message: '使用者未從登入驗證獲取憑證不予使用' }))
    }
    return next()
  }

  static authenticateUser(req, _, next) {
    const user = AuthToolKit.getUser(req)
    if (!user || blackListRoleIn.user.includes(user.role)) {
      return next(new APIError({ code: code.NOTFOUND, message: '帳號不存在' }))
    }
    return next()
  }

  static authenticateAdmin(req, _, next) {
    const user = AuthToolKit.getUser(req)
    if (!user || blackListRoleIn.admin.includes(user.role)) {
      return next(new APIError({ code: code.NOTFOUND, message: '帳號不存在' }))
    }
    return next()
  }
}

exports = module.exports = {
  AuthValidator
}
