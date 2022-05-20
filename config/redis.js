
require('dotenv').config()

module.exports = {
  development: {
    username: process.env.DEV_REDIS_USERNAME || '',
    password: process.env.DEV_REDIS_PASSWORD || '',
    host: process.env.DEV_REDIS_HOST,
    port: process.env.DEV_REDIS_PORT
  },
  test: {
    username: process.env.DEV_REDIS_USERNAME || '',
    password: process.env.DEV_REDIS_PASSWORD || '',
    host: process.env.DEV_REDIS_HOSTNAME,
    port: process.env.DEV_REDIS_PORT
  },
  production: {
    username: process.env.DEV_REDIS_USERNAME || '',
    password: process.env.DEV_REDIS_PASSWORD || '',
    host: process.env.DEV_REDIS_HOSTNAME,
    port: process.env.DEV_REDIS_PORT
  }
}
