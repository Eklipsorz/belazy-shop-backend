// If this is called standby, then load env variable with dotenv
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const { status, code } = require('./result-status-table').errorTable

/* general config */
const generalConfig = {
  blackListRoleIn: {
    user: ['admin'],
    admin: ['user']
  }
}

// const controller = {
//   userController: {

//   },
//   adminController: {

//   }
// }

/* service config */
// const service = {
//   accountService: {

//   },
//   userService: {

//   },
//   adminService: {

//   }
// }

/* middleware config */
const middleware = {
  APIErrorHandler: {
    DEFAULT_STATUS: status,
    DEFAULT_CODE: code.SERVERERROR,
    DEFAULT_MESSAGE: '系統出錯',
    DEFAULT_DATA: null
  }
}

/* seeder config */
const seeder = {
  usersSeeder: {
    // 設定每位使用者的預設密碼(含root)
    DEFAULT_PASSWORD: '12345678',
    // 設定Bcrypt 雜湊複雜度
    DEFAULT_BCRYPT_COMPLEXITY: 10,
    // 設定使用者預設數量
    DEFAULT_USER_NUMBER: 20,
    DEFAULT_EMAIL_PREFIX: process.env.SEEDER_EMAIL_PREFIX || 'user',
    DEFAULT_EMAIL_SUFFIX: process.env.SEEDER_EMAIL_SUFFIX || 'example.com'
  }
}

exports = module.exports = {
  // controller,
  // service
  generalConfig,
  middleware,
  seeder

}
