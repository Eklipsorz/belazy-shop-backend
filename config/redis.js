const { project } = require('./project')
require('dotenv').config({ path: project.ENV })

module.exports = {
  development: {
    username: process.env.DEV_REDIS_USERNAME || '',
    password: process.env.DEV_REDIS_PASSWORD || '',
    host: process.env.DEV_REDIS_HOSTNAME,
    port: process.env.DEV_REDIS_PORT
  },
  test: {
    username: process.env.CI_REDIS_USERNAME || '',
    password: process.env.CI_REDIS_PASSWORD || '',
    host: process.env.CI_REDIS_HOSTNAME,
    port: process.env.CI_REDIS_PORT
  },
  production: {
    username: process.env.PROD_REDIS_USERNAME || '',
    password: process.env.PROD_REDIS_PASSWORD || '',
    host: process.env.PROD_REDIS_HOSTNAME,
    port: process.env.PROD_REDIS_PORT
  }
}

