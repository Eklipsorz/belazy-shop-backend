const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Ownership, Category, Product, Stock, ProductStatistic, sequelize } = require('../../db/models')

class CategoryService {
  // Get all category (Only include category)
  // Get every product from a specific category
  // Get every product from every category
  static async getProductsFromCategories(req, type = 'get') {
    try {
      const { page, limit, offset, order } = req.query
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

      switch (type) {
        case 'get':
          findOption.limit = limit
          findOption.offset = offset
          break
        case 'search':
          // do something for searching
          break
      }

      // begin to find
      const categories = await Category.findAll(findOption)
      // nothing to find

      // return data
    } catch (error) {
      return { error: new APIError({ code, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  CategoryService
}
