const jwt = require('jsonwebtoken')
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
const ACCESS_TOKEN_OPTIONS = {
  expiresIn: '600s'
}

function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_OPTIONS)
}

exports = module.exports = {
  generateAccessToken
}
