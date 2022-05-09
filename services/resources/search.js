const { APIError } = require('../../helpers/api-error')
const { CategoryService } = require('./category')
const { status, code } = require('../../config/result-status-table').errorTable
const { ArrayToolKit } = require('../../helpers/array-tool-kit')
const { Ownership, Category, Product, Stock, ProductStatistic, sequelize } = require('../../db/models')

class SearchService {
  static async searchProducts(req) {

  }

  static async searchProductsFromCategory(req) {
    const { error, data, message } = await CategoryService.getCategories(req, 'search')
    if (error) return { error, data, message }
    try {
      const { keyword, by, page, limit, offset } = req.query
      const matchingType = by
      // match category according "by" parameter
      let result = ''
      const categories = data.resultCategories
      const searchOption = { data: categories, field: 'name', keyword }

      switch (matchingType) {
        case 'relevancy':
          result = ArrayToolKit.fuzzySearch(searchOption)
          break
        case 'accuracy':
          result = ArrayToolKit.exactSearch(searchOption)
          break
      }

      if (!result.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }) }
      }
      // get all products from some specific categories

      const products = await Promise
        .all(
          result.map(async item => {
            req.params.categoryId = item.id
            return await CategoryService.getProductsFromCategory(req, 'search')
          })
        )

      // [{error,data,message}, ..] -> [{data.productSet1}, {data.productSet2}]
      // every productSet is all products for each category
      // BTW, I use HashTable to de-duplicate the same product
      const productHashTable = {}
      const resultProductArrays = products.map(set => {
        if (set.error) return []
        // build "productCategory" property
        const productCategory = {
          categoryId: set.data.categoryId,
          categoryName: set.data.categoryName
        }

        // remove the same product
        const products = set.data.resultProducts
        const results = products.filter(product => {
          if (!productHashTable[product.id]) {
            product.productCategory = productCategory
            productHashTable[product.id] = true
            return product
          }
        })

        return results
      })
      // [{data.productSet1}, {data.productSet2}] -> [product1, product2, ....]
      let resultProducts = resultProductArrays.reduce((prev, next) => prev.concat(next))
      // paging
      resultProducts = resultProducts.slice(offset, offset + limit)

      return { error: null, data: { currentPage: page, resultProducts }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  SearchService
}
