const { AccountService } = require('./account')
const { ProductResource } = require('../resources/product')
const { CategoryResource } = require('../resources/category')
const { OrderResource } = require('../resources/order')
const { OrderResourceValidator } = require('../validators/order-resource-validator')

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

  async putStock(req, cb) {
    const { error, data, message } = await ProductResource.putStock(req)
    return cb(error, data, message)
  }

  async postProducts(req, cb) {
    const { error, data, message } = await ProductResource.postProducts(req)
    return cb(error, data, message)
  }

  async putProducts(req, cb) {
    const { error, data, message } = await ProductResource.putProducts(req)
    return cb(error, data, message)
  }

  async deleteProducts(req, cb) {
    const { error, data, message } = await ProductResource.deleteProducts(req)
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

  async postOrders(req, cb) {
    try {
      const result = await OrderResourceValidator.postOrders(req)
      const { error, data, message } = await OrderResource.postOrders(req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }
}

const adminServices = new AdminService()

exports = module.exports = {
  adminServices
}
