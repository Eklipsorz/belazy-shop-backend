
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Ownership, Stock, ProductStatistic } = require('../../db/models')
class ProductService {
  static async getProducts(req) {
    try {
      const { page, limit, offset, order } = req.query

      const findOption = {
        include: [
          {
            model: Ownership,
            attributes: ['categoryId', 'categoryName'],
            as: 'productCategory'
          },
          {
            model: Stock,
            attributes: ['quantity', 'restQuantity'],
            as: 'stock'
          },
          {
            model: ProductStatistic,
            attributes: ['likedTally', 'repliedTally'],
            as: 'statistics'
          }
        ],
        order: [['updatedAt', order]],
        limit,
        offset,
        nest: true
      }
      const products = await Product.findAll(findOption)

      if (!products.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }) }
      }
      const resultProduct = products.map(product => product.toJSON())
      return { error: null, data: { currentPage: page, resultProduct }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ProductService
}
