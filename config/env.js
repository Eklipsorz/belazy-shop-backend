
require('dotenv').config()
const NODE_ENV = process.env.NODE_ENV
let ENV = {}

switch (NODE_ENV) {
  case 'production':
    ENV = {
      ACCESS_TOKEN_SECRET: process.env.PRODUCT_ACCESS_TOKEN_SECRET,
      REFRESH_TOKEN_SECRET: process.env.PRODUCT_REFRESH_TOKEN_SECRET,
      SEEDER_EMAIL_PREFIX: process.env.PRODUCT_SEEDER_EMAIL_PREFIX,
      SEEDER_EMAIL_SUFFIX: process.env.PRODUCT_SEEDER_EMAIL_SUFFIX,
      IMGUR_CLIENT_ID: process.env.PRODUCT_IMGUR_CLIENT_ID
    }

    break
  case 'development':
    ENV = {
      ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
      SEEDER_EMAIL_PREFIX: process.env.SEEDER_EMAIL_PREFIX,
      SEEDER_EMAIL_SUFFIX: process.env.SEEDER_EMAIL_SUFFIX,
      IMGUR_CLIENT_ID: process.env.IMGUR_CLIENT_ID
    }
    break
}

exports = module.exports = {
  ENV
}
