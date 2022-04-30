const passport = require('../config/passport')
const { getUser } = require('../helpers/auth-user-getter')
const { blackListRoleIn } = require('../config/app').generalConfig
const { code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')

function authenticate(req, res, next) {
  function cb(error, user) {
    if (error || !user) {
      return next(new APIError({ code: code.FORBIDDEN, message: '使用者未從登入驗證獲取憑證不予使用' }))
    }
    req.user = user
    return next()
  }

  const verify = passport.authenticate('jwt', { session: false }, cb)
  verify(req, res, next)
}

function authenticateUser(req, _, next) {
  const user = getUser(req)
  if (!user || blackListRoleIn.user.includes(user.role)) {
    return next(new APIError({ code: code.NOTFOUND, message: '帳號不存在' }))
  }
  return next()
}

function authenticateAdmin(req, _, next) {
  const user = getUser(req)
  if (!user || blackListRoleIn.admin.includes(user.role)) {
    return next(new APIError({ code: code.NOTFOUND, message: '帳號不存在' }))
  }
  return next()
}

exports = module.exports = {

  authenticate,
  authenticateUser,
  authenticateAdmin
}
