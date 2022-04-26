const { AccountService } = require('../services/account-service')
const { ProductService } = require('../services/product-service')

class UserService extends AccountService {
  constructor() {
    super('user')
    this.getProducts = ProductService.getProducts
  }
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
