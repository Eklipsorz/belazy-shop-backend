
const accountService = {
  blackListRoleIn: {
    users: ['admin'],
    admin: ['user']
  }
}

const generalErrorCode = {
  FORBIDDEN: 403,
  NOTFOUND: 404,
  SERVERERROR: 500
}
exports = module.exports = {
  accountService,
  generalErrorCode
}
