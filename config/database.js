const fs = require('fs')
const { projectSettings } = require('./project')
require('dotenv').config({ path: projectSettings.ENV })

module.exports = {
  development: {
    username: process.env.DEV_DB_USERNAME,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    host: process.env.DEV_DB_HOSTNAME,
    port: process.env.DEV_DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      bigNumberStrings: true
      // ssl: {
      //   key: fs.readFileSync(__dirname + '/ssl/db/client-key.pem'),
      //   cert: fs.readFileSync(__dirname + '/ssl/db/client-cert.pem'),
      //   ca: fs.readFileSync(__dirname + '/ssl/db/server-ca.pem')
      // }
    }
  },
  test: {
    username: process.env.CI_DB_USERNAME,
    password: process.env.CI_DB_PASSWORD,
    database: process.env.CI_DB_NAME,
    host: process.env.CI_DB_HOSTNAME,
    port: process.env.CI_DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      bigNumberStrings: true
    }
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOSTNAME,
    port: process.env.PROD_DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      bigNumberStrings: true,
      ssl: {
        key: fs.readFileSync(__dirname + '/ssl/db/client-key.pem'),
        cert: fs.readFileSync(__dirname + '/ssl/db/client-cert.pem'),
        ca: fs.readFileSync(__dirname + '/ssl/db/server-ca.pem')
      }
    }
  }
}
