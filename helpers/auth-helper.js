const passport = require('../config/passport')
const { code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error-helper')

function getUser(req) {
  return req.user || null
}

function getUserId(req) {
  return getUser(req)?.id
}

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

function authenticateUser(req, res, next) {
  const user = getUser(req)
}

function authenticateAdmin(req, res, next) {

}
exports = module.exports = {
  getUser,
  getUserId,
  authenticate,
  authenticateUser,
  authenticateAdmin
}
