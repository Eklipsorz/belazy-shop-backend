
class AuthToolKit {
  static getUser(req) {
    return req.user || null
  }

  static getUserId(req) {
    return this.getUser(req)?.id
  }
}

exports = module.exports = {
  AuthToolKit
}
