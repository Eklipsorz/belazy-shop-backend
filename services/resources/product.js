
const { APIError } = require('../../helpers/api-error')
const Fuse = require('fuse.js')

const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Category, Ownership, Stock, ProductStatistic } = require('../../db/models')

class ProductService {
  static async getProducts(req, type) {
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
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應產品' }) }
      }
      const resultProduct = product.toJSON()
      return { error: null, data: resultProduct, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async getSearchHints(req) {
    try {
      const { keyword } = req.query
      if (!keyword) {
        return { error: new APIError({ code: code.BADREQUEST, status, message: '關鍵字為空' }) }
      }
      // 建立一個搜尋用的關鍵字陣列
      const keywords = []
      // 獲取所有類別的名稱，來加進關鍵字陣列
      const categories = await Category.findAll({
        attributes: ['name'],
        raw: true
      })
      // 獲取所有產品的名稱，來加進關鍵字陣列
      const products = await Product.findAll({
        attributes: ['name'],
        raw: true
      })

      categories.forEach(category => { category.type = 'category' })
      products.forEach(product => { product.type = 'product' })

      keywords.push(...categories, ...products)

      const fuseOptions = {
        keys: ['name']
      }
      const fuse = new Fuse(keywords, fuseOptions)
      const fuseResults = fuse.search(keyword)

      const results = fuseResults.map(fuseResult => fuseResult.item)
      return { error: null, data: results, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ProductService
}
