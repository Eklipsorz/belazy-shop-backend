const { AccountService } = require('./account')
const { ProductResource } = require('../resources/product')
const { CategoryResource } = require('../resources/category')
const { OrderResource } = require('../resources/order')

class AdminService extends AccountService {
  constructor() {
    super('admin')
  }

  async getProducts(req, cb) {
    try {
      const { error, data, message } = await ProductResource.getProducts(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getProduct(req, cb) {
    try {
      const { error, data, message } = await ProductResource.getProduct(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getStock(req, cb) {
    try {
      const { error, data, message } = await ProductResource.getStock(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async putStock(req, cb) {
    try {
      const { error, data, message } = await ProductResource.putStock(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async postProducts(req, cb) {
    try {
      const { error, data, message } = await ProductResource.postProducts(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async putProducts(req, cb) {
    try {
      const { error, data, message } = await ProductResource.putProducts(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async deleteProducts(req, cb) {
    try {
      const { error, data, message } = await ProductResource.deleteProducts(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getCategory(req, cb) {
    try {
      const { error, data, message } = await CategoryResource.getCategory(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getCategories(req, cb) {
    try {
      const { error, data, message } = await CategoryResource.getCategories(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getProductsFromCategory(req, cb) {
    try {
      const { error, data, message } = await CategoryResource.getProductsFromCategory(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getProductsFromCategories(req, cb) {
    const { error, data, message } = await CategoryResource.getProductsFromCategories(req)
    return cb(error, data, message)
  }

  async postOrders(req, cb) {
    try {
      const { error, data, message } = await OrderResource.postOrders(req)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getOrders(req, cb) {
    try {
      const { limit, offset, order } = req.query
      const findOption = {
        // detemeter how to find
        limit,
        offset,
        order: [['createdAt', order]]
      }
      const option = { user: null, findOption }

      const { error, data, message } = await OrderResource.getOrders(req, option)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getOrder(req, cb) {
    try {
      const { orderId } = req.params
      const findOption = {
        where: { id: orderId }
      }
      const option = { findOption }

      const { error, data, message } = await OrderResource.getOrder(req, option)
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
