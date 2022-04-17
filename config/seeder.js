// If this is called standby, then load env variable with dotenv
if (process.env.NODE_ENV !== 'development') {
  require('dotenv').config()
}

/* User Seeder  */
// 設定每位使用者的籲馬密碼(含root)
const DEFAULT_PASSWORD = '12345678'

// 設定Bcrypt 雜湊複雜度
const DEFAULT_BCRYPT_COMPLEXITY = 10

// 設定使用者預設數量
const DEFAULT_USER_NUMBER = 20

const DEFAULT_EMAIL_PREFIX = process.env.SEEDER_EMAIL_PREFIX || 'user'

const DEFAULT_EMAIL_SUFFIX = process.env.SEEDER_EMAIL_SUFFIX || 'example.com'

exports = module.exports = {
  // User
  DEFAULT_PASSWORD,
  DEFAULT_USER_NUMBER,
  DEFAULT_EMAIL_PREFIX,
  DEFAULT_EMAIL_SUFFIX,
  // Password
  DEFAULT_BCRYPT_COMPLEXITY
}
