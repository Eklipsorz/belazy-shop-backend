const errorTable = {
  status: 'error',
  code: {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOTFOUND: 404,
    SERVERERROR: 500
  }
}
const successTable = {
  status: 'success',
  code: {
    OK: 200
  }

}
exports = module.exports = {
  errorTable,
  successTable
}
