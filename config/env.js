const { project } = require('./project')
require('dotenv').config({ path: project.ENV })

const NODE_ENV = process.env.NODE_ENV || 'development'

let ENV = {}
switch (NODE_ENV) {
  case 'production':
    ENV = {
      PORT: process.env.PROD_PORT || 8080,
      SESSION_SECRET: process.env.PROD_SESSION_SECRET,
      ACCESS_TOKEN_SECRET: process.env.PROD_ACCESS_TOKEN_SECRET,
      REFRESH_TOKEN_SECRET: process.env.PROD_REFRESH_TOKEN_SECRET,
      SEEDER_EMAIL_PREFIX: process.env.PROD_SEEDER_EMAIL_PREFIX,
      SEEDER_EMAIL_SUFFIX: process.env.PROD_SEEDER_EMAIL_SUFFIX,
      SENDGRID_APIKEY: process.env.PROD_SENDGRID_APIKEY,
      APP_SSLKEY: process.env.PROD_SSL_APPKEY_PATH,
      APP_SSLCERT: process.env.PROD_SSL_APPCERT_PATH,
      DB_SSLKEY: process.env.PROD_SSL_DBKEY_PATH,
      DB_SSLCERT: process.env.PROD_SSL_DBCERT_PATH,
      DB_SSLCA: process.env.PROD_SSL_DBCA_PATH,
      CREDENTIALS: process.env.PROD_CREDENTIALS_PATH
    }

    break
  case 'development':
    ENV = {
      PORT: process.env.PORT,
      SESSION_SECRET: process.env.SESSION_SECRET,
      ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
      SEEDER_EMAIL_PREFIX: process.env.SEEDER_EMAIL_PREFIX,
      SEEDER_EMAIL_SUFFIX: process.env.SEEDER_EMAIL_SUFFIX,
      SENDGRID_APIKEY: process.env.SENDGRID_APIKEY
    }
    break
}

exports = module.exports = {
  ENV
}
