const { APIError } = require('../../helpers/api-error')
const { CategoryResource } = require('./category')
const { ProductResource } = require('./product')
const { status, code } = require('../../config/result-status-table').errorTable
const { ArrayToolKit } = require('../../utils/array-tool-kit')

const { Category, Product } = require('../../db/models')

class SearchResource {
  static async getSearchHints(req) {
    const { keyword, by, page, offset, limit } = req.query
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

    const searchOption = { data: keywords, field: 'name', keyword }
    const matchingType = by
    let result = []

    switch (matchingType) {
      case 'relevancy':
        result = ArrayToolKit.fuzzySearch(searchOption)
        break
      case 'accuracy':
        result = ArrayToolKit.exactSearch(searchOption)
        break
    }

    result = result.slice(offset, offset + limit)
    if (!result.length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }

    return { error: null, data: { currentPage: page, result: result }, message: '獲取成功' }
  }

  static async searchProducts(req) {
    const { data } = await ProductResource.getProducts(req, 'search')
    const { keyword, by, page, limit, offset } = req.query
    const matchingType = by
    // match category according "by" parameter
    let result = ''

    const searchOption = { data: data.resultProducts, field: 'name', keyword }

    switch (matchingType) {
      case 'relevancy':
        result = ArrayToolKit.fuzzySearch(searchOption)
        break
      case 'accuracy':
        result = ArrayToolKit.exactSearch(searchOption)
        break
    }

    if (!result.length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    // paging
    const resultProducts = result.slice(offset, offset + limit)

    return { error: null, data: { currentPage: page, resultProducts }, message: '獲取成功' }
  }

  static async searchProductsFromCategory(req) {
    const { error, data, message } = await CategoryResource.getCategories(req, 'search')
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
            return await CategoryResource.getProductsFromCategory(req, 'search')
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
      if (!resultProducts.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }) }
      }
      // paging
      resultProducts = resultProducts.slice(offset, offset + limit)

      return { error: null, data: { currentPage: page, resultProducts }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  SearchResource
}
