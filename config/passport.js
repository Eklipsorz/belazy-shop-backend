const passport = require('passport')
const passportJWT = require('passport-jwt')

const { User } = require('../db/models')
const ExtractJWT = require('passport-jwt').ExtractJwt
const JWTStrategy = passportJWT.Strategy

const JWTStrategyOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET
}

async function JWTVerify(payload, cb) {
  try {
    const user = await User.findByPk(payload.id)

    if (!user) return cb(null, false)
    return cb(null, user.toJSON())
  } catch (error) {
    return cb(error, false)
  }
}

passport.use(new JWTStrategy(JWTStrategyOptions, JWTVerify))

exports = module.exports = passport
