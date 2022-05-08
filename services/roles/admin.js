const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')
const { CategoryService } = require('../resources/category')

class AdminService extends AccountService {
  constructor() {
    super('admin')
  }

  async getProducts(req, cb) {
    const { error, data, message } = await ProductService.getProducts(req)
    return cb(error, data, message)
  }

  async getProduct(req, cb) {
    const { error, data, message } = await ProductService.getProduct(req)
    return cb(error, data, message)
  }

  async getCategories(req, cb) {
    console.log('admin categories')
    const { error, data, message } = await CategoryService.getCategories(req)
    return cb(error, data, message)
  }
}

const adminServices = new AdminService()

exports = module.exports = {
  adminServices
}
