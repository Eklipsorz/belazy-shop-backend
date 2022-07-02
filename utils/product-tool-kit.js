const validator = require('validator')
const { ParameterValidationKit } = require('./parameter-validation-kit')
const { code } = require('../config/result-status-table').errorTable
const { MIN_LENGTH_NAME, MAX_LENGTH_NAME } = require('../config/app').service.productResource
const { Product, Category, Sequelize } = require('../db/models')

class ProductToolKit {
  static async postProductsValidate(req) {
    return await ProductToolKit.productsValidate(req, 'post')
  }

  static async putProductsValidate(req) {
    // check whether the product exists?
    const { productId } = req.params
    const product = await Product.findByPk(productId)
    let result = {}

    if (!product) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應項目' }
      return { error: true, result }
    }
    // check whether the parameters are valid
    // - one of all fields (name, categoryId) is empty ?
    // - length of product name is longer than 30 characters ?
    // - categoryId can be mapped to valid category ?
    // - product name is repeated ?
    const validation = await ProductToolKit.productsValidate(req, 'put')
    if (validation.error) return validation

    // all input is good
    validation.result.data.product = product

    return { error: false, result: validation.result }
  }

  static async productsValidate(req, type) {
    const messageQueue = []
    let { name, categoryId } = req.body

    const { isNumberString, isInvalidFormat } = ParameterValidationKit
    let result = {}
    if (req.body?.name) req.body.name = name = name.trim()
    if (req.body?.categoryId) req.body.categoryId = categoryId = categoryId.trim()
    // check whether the parameters are valid
    // - one of all fields (name, categoryId) is empty ?
    if (isInvalidFormat(name) || isInvalidFormat(categoryId)) {
      result = { code: code.BADREQUEST, data: req.body, message: '名稱和產品類別要填寫' }
      return { error: true, result }
    }

    // - length of product name is longer than 30 characters ?
    if (!validator.isLength(name, { min: MIN_LENGTH_NAME, max: MAX_LENGTH_NAME })) {
      messageQueue.push(`名稱字數範圍：${MIN_LENGTH_NAME}-${MAX_LENGTH_NAME}`)
    }

    // categoryId self is valid number or number string?
    const categories = []
    const categoryArray = categoryId.split(' ')

    const isValiCategoryArray = categoryArray.every(categoryId => isNumberString(categoryId))

    if (isValiCategoryArray) {
      for (const id of categoryArray) {
        const category = await Category.findByPk(id)
        if (!category) {
          messageQueue.push('至少有一個產品類別不存在')
          break
        }
        categories.push(category)
      }
    } else {
      messageQueue.push('至少有一個產品類別不存在')
    }

    // - product name is repeated ?
    let findOption = {}
    switch (type) {
      case 'post': {
        findOption = { where: { name } }
        break
      }
      case 'put': {
        const { Op } = Sequelize
        const { productId } = req.param
        findOption = { where: { name, id: { [Op.ne]: productId } } }
        break
      }
    }

    const product = await Product.findOne(findOption)
    if (product) {
      messageQueue.push('產品名稱不能與其他產品重複')
    }

    if (messageQueue.length) {
      result = { code: code.BADREQUEST, data: req.body, message: messageQueue }
      return { error: true, result }
    }

    result = { code: null, data: { product, categories } }
    return { error: false, result }
  }

  static async updateStockValidate(req) {
    const messageQueue = []
    const { quantity, restQuantity, price } = req.body
    const { isNaN, isInvalidFormat } = ParameterValidationKit

    const { productId } = req.params
    const redisClient = req.app.locals.redisClient
    const stocktKey = `stock:${productId}`

    const product = await redisClient.hgetall(stocktKey)
    let result = {}

    const isExistProductInCache = Boolean(Object.keys(product).length)

    if (!isExistProductInCache) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應項目' }
      return { error: true, result }
    }

    if (isInvalidFormat(quantity) || isInvalidFormat(restQuantity) || isInvalidFormat(price)) {
      messageQueue.push('所有欄位都要填寫')
      result = { code: code.BADREQUEST, data: req.body, message: messageQueue }
      return { error: true, result }
    }

    if (isNaN(quantity) || isNaN(restQuantity) || isNaN(price)) {
      messageQueue.push('所有欄位都必須是數字')
      result = { code: code.BADREQUEST, data: req.body, message: messageQueue }
      return { error: true, result }
    }

    if (price <= 0) messageQueue.push('產品價格要大於0')
    if (quantity <= 0) messageQueue.push('產品庫存量要大於0')
    if (restQuantity <= 0) messageQueue.push('剩餘庫存數量要大於0')
    if (restQuantity > quantity) messageQueue.push('剩餘量必須小於數量')

    if (messageQueue.length) {
      result = { code: code.BADREQUEST, data: req.body, message: messageQueue }
      return { error: true, result }
    }

    result = { code: null, data: product }
    return { error: false, result }
  }
}

exports = module.exports = {
  ProductToolKit
}
