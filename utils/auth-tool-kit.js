const jwt = require('jsonwebtoken')
const { ENV } = require('../config/env')
const { tokenExpiresIn } = require('../config/app').generalConfig

const ACCESS_TOKEN_SECRET = ENV.ACCESS_TOKEN_SECRET
const ACCESS_TOKEN_OPTIONS = {
  expiresIn: tokenExpiresIn.accessToken
}

class AuthToolKit {
  static getUser(req) {
    console.log('inside getUser')
    return req.user || null
  }

  static getUserId(req) {
    return this.getUser(req)?.id
  }

  static generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_OPTIONS)
  }
}

exports = module.exports = {
  AuthToolKit
}
