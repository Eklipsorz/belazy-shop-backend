
const { APIError } = require('../../helpers/api-error')
const { ArrayToolKit } = require('../../utils/array-tool-kit')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Ownership, Stock, ProductStatistic } = require('../../db/models')

class ProductService {
  static async getProducts(req, type = 'get') {
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
        order: [['createdAt', order]],
        nest: true
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

      const products = await Product.findAll(findOption)

      if (!products.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }) }
      }
      const resultProducts = products.map(product => product.toJSON())
      return { error: null, data: { currentPage: page, resultProducts }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async getProduct(req) {
    try {
      const { productId } = req.params
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
        nest: true
      }
      const product = await Product.findByPk(productId, findOption)

      if (!product) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }
      const resultProduct = product.toJSON()
      return { error: null, data: resultProduct, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ProductService
}
