const validator = require('validator')
const { User } = require('../db/models')

async function postUsersFormDataValidator(req) {
  const errorMessageQueue = []
  const {
    account, nickname,
    email, password,
    confirmPassword
  } = req.body
  
}

exports = module.exports = {
  postUsersFormDataValidator
}
