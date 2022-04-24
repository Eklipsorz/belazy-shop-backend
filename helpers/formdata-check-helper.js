
const validator = require('validator')
const { User } = require('../db/models')

async function postUsersFormDataValidator(req) {
  const messageQueue = []
  const {
    account, nickname,
    email, password,
    confirmPassword
  } = req.body

  // 未填寫完所有欄位
  if (!account || !nickname || !email || !password || !confirmPassword) {
    messageQueue.push({ message: '未填寫完所有欄位' })
  }
  // 使用者暱稱名稱超過30字
  if (nickname && !validator.isLength(nickname, { min: 0, max: 30 })) {
    messageQueue.push({ message: '使用者暱稱名稱超過30字' })
  }

  // 帳號名稱超過10字
  if (account && !validator.isLength(account, { min: 0, max: 10 })) {
    messageQueue.push({ message: '帳號名稱超過10字' })
  }

  // 電子郵件不是正確格式
  if (email && !validator.isEmail(email)) {
    messageQueue.push({ message: '電子郵件不是正確格式' })
  }

  // 密碼和確認密碼不一致
  if (password !== confirmPassword) {
    messageQueue.push({ message: '密碼和確認密碼不一致' })
  }

  // 電子郵件重複註冊
  if ((await User.findOne({ where: { email } }))) {
    messageQueue.push({ message: '電子郵件重複註冊' })
  }

  // 帳號重複註冊
  if ((await User.findOne({ where: { account } }))) {
    messageQueue.push({ message: '帳號重複註冊' })
  }

  return messageQueue
}

exports = module.exports = {
  postUsersFormDataValidator
}
