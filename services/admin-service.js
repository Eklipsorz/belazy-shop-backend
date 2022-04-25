const { AccountService } = require('../services/account-service')

class AdminService extends AccountService {
  constructor() {
    super('admin')
  }
}

const adminServices = new AdminService()

exports = module.exports = {
  adminServices
}
