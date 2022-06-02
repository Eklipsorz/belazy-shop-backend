const { AccountService } = require('./account')
const { ProductResource } = require('../resources/product')
const { CategoryResource } = require('../resources/category')

class AdminService extends AccountService {
  constructor() {
    super('admin')
  }

  async getProducts(req, cb) {
    const { error, data, message } = await ProductResource.getProducts(req)
    return cb(error, data, message)
  }

  async getProduct(req, cb) {
    const { error, data, message } = await ProductResource.getProduct(req)
    return cb(error, data, message)
  }

  async getStock(req, cb) {
    const { error, data, message } = await ProductResource.getStock(req)
    return cb(error, data, message)
  }

  async getCategory(req, cb) {
    const { error, data, message } = await CategoryResource.getCategory(req)
    return cb(error, data, message)
  }

  async getCategories(req, cb) {
    const { error, data, message } = await CategoryResource.getCategories(req)
    return cb(error, data, message)
  }

  async getProductsFromCategory(req, cb) {
    const { error, data, message } = await CategoryResource.getProductsFromCategory(req)
    return cb(error, data, message)
  }

  async getProductsFromCategories(req, cb) {
    const { error, data, message } = await CategoryResource.getProductsFromCategories(req)
    return cb(error, data, message)
  }
}

const adminServices = new AdminService()

exports = module.exports = {
  adminServices
}
