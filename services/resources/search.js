const { APIError } = require('../../helpers/api-error')
const { CategoryResource } = require('./category')
const { ProductResource } = require('./product')
const { code } = require('../../config/result-status-table').errorTable
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
    let searchResult = []

    switch (matchingType) {
      case 'relevancy':
        searchResult = ArrayToolKit.fuzzySearch(searchOption)
        break
      case 'accuracy':
        searchResult = ArrayToolKit.exactSearch(searchOption)
        break
    }

    const currentPage = ArrayToolKit.getArrayByCurrentPage(searchResult, offset, limit)
    const { result } = currentPage
    if (currentPage.error) {
      throw new APIError({ code: result.code, data: result.data, message: result.message })
    }

    return { error: null, data: { currentPage: page, result: result }, message: '獲取成功' }
  }

  static async searchProducts(req) {
    const { data } = await ProductResource.getProducts(req, 'search')
    const { keyword, by, page, limit, offset, order } = req.query
    const matchingType = by
    // match category according "by" parameter
    let searchResult = []

    const searchOption = { data: data.resultProducts, field: 'name', keyword }

    switch (matchingType) {
      case 'relevancy':
        searchResult = ArrayToolKit.fuzzySearch(searchOption)
        break
      case 'accuracy':
        searchResult = ArrayToolKit.exactSearch(searchOption)
        break
    }

    if (!searchResult.length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    // paging
    let compare = null
    switch (order) {
      case 'ASC':
        compare = (a, b) => (Date.parse(a.createdAt) - Date.parse(b.createdAt))
        break
      case 'DESC':
      default:
        compare = (a, b) => (Date.parse(b.createdAt) - Date.parse(a.createdAt))
        break
    }

    searchResult = searchResult.sort(compare)
    const currentPage = ArrayToolKit.getArrayByCurrentPage(searchResult, offset, limit)
    const { result } = currentPage

    if (currentPage.error) {
      throw new APIError({ code: result.code, data: result.data, message: result.message })
    }

    return { error: null, data: { currentPage: page, resultProducts: result }, message: '獲取成功' }
  }

  static async searchProductsFromCategory(req) {
    const { data } = await CategoryResource.getCategories(req, 'search')
    const { keyword, by, page, limit, offset, order } = req.query
    const matchingType = by
    // match category according "by" parameter
    let searchResult = []
    const categories = data.resultCategories
    const searchOption = { data: categories, field: 'name', keyword }

    switch (matchingType) {
      case 'relevancy':
        searchResult = ArrayToolKit.fuzzySearch(searchOption)
        break
      case 'accuracy':
        searchResult = ArrayToolKit.exactSearch(searchOption)
        break
    }
    // The category user want to find does not exist
    if (!searchResult.length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應類別' })
    }

    // get all products from some specific categories
    req.params.categoryId = searchResult[0].id
    const ownerships = await CategoryResource.getProductsFromCategory(req, 'search')

    const { categoryId, categoryName } = ownerships.data
    let { resultProducts } = ownerships.data
    // // The category user want to search really exists but there is nothing in that category

    if (!resultProducts.length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    // paging
    let compare = null
    switch (order) {
      case 'ASC':
        compare = (a, b) => (Date.parse(a.createdAt) - Date.parse(b.createdAt))
        break
      case 'DESC':
      default:
        compare = (a, b) => (Date.parse(b.createdAt) - Date.parse(a.createdAt))
        break
    }
    resultProducts = resultProducts.sort(compare)

    const currentPage = ArrayToolKit.getArrayByCurrentPage(resultProducts, offset, limit)
    const { result } = currentPage

    // There is nothing in the current page
    if (currentPage.error) {
      throw new APIError({ code: result.code, data: result.data, message: result.message })
    }

    const resultObject = {
      categoryId,
      categoryName,
      currentPage: page,
      resultProducts
    }
    return { error: null, data: resultObject, message: '獲取成功' }
  }
}

exports = module.exports = {
  SearchResource
}
