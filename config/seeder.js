// If this is called standby, then load env variable with dotenv
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
/* User Seeder  */

const usersSeeder = {
  // 設定每位使用者的預設密碼(含root)
  DEFAULT_PASSWORD: '12345678',
  // 設定Bcrypt 雜湊複雜度
  DEFAULT_BCRYPT_COMPLEXITY: 10,
  // 設定使用者預設數量
  DEFAULT_USER_NUMBER: 20,
  DEFAULT_EMAIL_PREFIX: process.env.SEEDER_EMAIL_PREFIX || 'user',
  DEFAULT_EMAIL_SUFFIX: process.env.SEEDER_EMAIL_SUFFIX || 'example.com'

}

exports = module.exports = {
  // user seeder config
  usersSeeder
}
