const passport = require('passport')
const passportJWT = require('passport-jwt')

const { user } = require('../db/models')
const ExtractJWT = require('passport-jwt').ExtractJwt
const JWTStrategy = passportJWT.Strategy

const JWTStrategyOptions = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_SECRET
}

const JWTVerify = (payload, cb) => {

}

passport.use(new JWTStrategy(JWTStrategyOptions, JWTVerify))

exports = module.exports = passport
