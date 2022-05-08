const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Ownership, Category, Product, Stock, ProductStatistic, sequelize } = require('../../db/models')

class CategoryService {
  // Get all category (Only include category)
  static async getCategories(req, type = 'get') {
    try {
      const { page, limit, offset, order } = req.query
      // define how to find
      const findOption = {
        // settings
        order: [['createdAt', order]]
      }
      switch (type) {
        case 'get':
          findOption.limit = limit
          findOption.offset = offset
          break
        case 'search':
          break
      }
      // begin to find
      const categories = await Category.findAll(findOption)

      // nothing to find
      if (!categories.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到產品類別' }) }
      }

      const resultCategories = categories.map(category => category.toJSON())

      return { error: null, data: { currentPage: page, resultCategories }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  // Get a specific category
  static async getCategory(req) {
    try {
      const { categoryId } = req.params

      // define how to find
      const findOption = {
        // settings
      }

      // begin to find
      const category = await Category.findByPk(categoryId)
      // nothing to find
      if (!category) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }
      // return data
      const resultCategory = category.toJSON()
      return { error: null, data: resultCategory, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  // Get every product from a specific category
  static async getProductsFromCategory(req, type = 'get') {

  }

  // Get every product from every category
  static async getProductsFromCategories(req) {
    try {
      const { order } = req.query
      // define how to find
      const includeProductOption = [
        { model: Stock, attributes: ['quantity', 'restQuantity'], as: 'stock' },
        { model: ProductStatistic, attributes: ['likedTally', 'repliedTally'], as: 'statistics' }
      ]

      const findOption = {
        include: [
          {
            model: Ownership,
            attributes: ['categoryId', 'productId'],
            include: [
              { model: Product, include: includeProductOption }
            ]
          }
        ],
        attributes: [
          ['id', 'categoryId'],
          ['name', 'categoryName']
        ],
        order: [
          [sequelize.literal('`Ownerships.Product.updatedAt`'), order]
        ]
      }

      // begin to find
      const products = await Category.findAll(findOption)

      // nothing to find
      if (!products.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }) }
      }

      // return data
      const resultProducts = products.map(product => product.toJSON())
      return { error: null, data: { resultProducts }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  CategoryService
}
