const { AccountService } = require('../services/account-service')
const { ProductService } = require('../services/product-service')

class AdminService extends AccountService {
  constructor() {
    super('admin')
    this.getProducts = ProductService.getProducts
  }
}

const adminServices = new AdminService()

exports = module.exports = {
  adminServices
}
