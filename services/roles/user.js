const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')

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
