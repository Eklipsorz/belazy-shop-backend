const passport = require('passport')
const passportJWT = require('passport-jwt')
const { ENV } = require('./env')
const { User, Like, Reply } = require('../db/models')
const ExtractJWT = require('passport-jwt').ExtractJwt
const JWTStrategy = passportJWT.Strategy

const JWTStrategyOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: ENV.ACCESS_TOKEN_SECRET
}

async function JWTVerify(payload, cb) {
  try {
    const findOption = {
      include: [
        { model: Like, attributes: ['productId'], as: 'likedProducts' },
        { model: Reply, attributes: ['productId'], as: 'repliedProducts' }
      ]
    }
    const user = await User.findByPk(payload.id, findOption)

    if (!user) return cb(null, false)
    return cb(null, user.toJSON())
  } catch (error) {
    return cb(error, false)
  }
}

passport.use(new JWTStrategy(JWTStrategyOptions, JWTVerify))

exports = module.exports = passport
