/* User Seeder  */
// 設定每位使用者的籲馬密碼(含root)
const DEFAULT_PASSWORD = '12345678'

// 設定Bcrypt 雜湊複雜度
const DEFAULT_BCRYPT_COMPLEXITY = 10

// 設定使用者預設數量
const DEFAULT_USER_NUMBER = 20

exports = module.exports = {
  // User
  DEFAULT_PASSWORD,
  DEFAULT_USER_NUMBER,
  // Password
  DEFAULT_BCRYPT_COMPLEXITY
}
