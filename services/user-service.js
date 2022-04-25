const { AccountService } = require('../services/account-service')
class UserService extends AccountService {
  constructor() {
    super('user')
  }
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
