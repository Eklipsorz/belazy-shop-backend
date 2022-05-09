const { APIError } = require('../../helpers/api-error')

const { status, code } = require('../../config/result-status-table').errorTable
const { Ownership, Category, Product, Stock, ProductStatistic, sequelize } = require('../../db/models')

class SearchService {
  static async searchProducts(req) {

  }

  static async searchProductsFromCategory(req) {
  }
}

exports = module.exports = {
  SearchService
}
