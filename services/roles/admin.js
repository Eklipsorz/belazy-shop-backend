const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')

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
