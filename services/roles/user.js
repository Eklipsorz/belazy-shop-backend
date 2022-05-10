const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')
const { CategoryService } = require('../resources/category')
const { LikeService } = require('../resources/like')

const { userService } = require('../../config/app').service
const { APIError } = require('../../helpers/api-error')
const { code, status } = require('../../config/result-status-table').errorTable
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { SearchService } = require('../resources/search')

// isLiked & isReplied status marker for each product
function statusMarker(req, products) {
  const loginUser = AuthToolKit.getUser(req)

  products = Array.isArray(products) ? products : [products]

  const likedProducts = loginUser.likedProducts
  const repliedProducts = loginUser.repliedProducts

  products.forEach(product => {
    product.isLiked = likedProducts.some(lp => lp.productId === product.id)
    product.isReplied = repliedProducts.some(rp => rp.productId === product.id)
  })
}

class UserService extends AccountService {
  constructor() {
    super('user')
  }

  // get all products
  async getProducts(req, cb) {
    const { error, data, message } = await ProductService.getProducts(req, 'get')
    if (error) return cb(error, data, message)

    try {
      const products = data.resultProducts
      statusMarker(req, products)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get a specific product
  async getProduct(req, cb) {
    const { error, data, message } = await ProductService.getProduct(req)

    if (error) return cb(error, data, message)
    try {
      const product = data
      statusMarker(req, product)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get search hint when user input something in search bar
  async getSearchHints(req, cb) {
    const { error, data, message } = await SearchService.getSearchHints(req)
    if (error) return cb(error, data, message)

    try {
      const hintNumber = userService.SEARCH_HINT_NUMBER
      const results = data.slice(0, hintNumber)
      return cb(error, results, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // search product with a specific product name
  async searchProducts(req, cb) {
    const { error, data, message } = await SearchService.searchProducts(req)
    if (error) return cb(error, data, message)
    try {
      const resultProducts = data.resultProducts
      // mark isLiked & isReplied
      statusMarker(req, resultProducts)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // search products with a specific category
  async searchProductsFromCategory(req, cb) {
    const { error, data, message } = await SearchService.searchProductsFromCategory(req)
    if (error) return cb(error, data, message)
    try {
      const resultProducts = data.resultProducts
      // mark isLiked & isReplied
      statusMarker(req, resultProducts)
      return cb(null, data, '獲取成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get a specific category
  async getCategory(req, cb) {
    const { error, data, message } = await CategoryService.getCategory(req)
    return cb(error, data, message)
  }

  // get all categories
  async getCategories(req, cb) {
    const { error, data, message } = await CategoryService.getCategories(req)
    return cb(error, data, message)
  }

  // get all products from a specific category
  async getProductsFromCategory(req, cb) {
    const { error, data, message } = await CategoryService.getProductsFromCategory(req)
    if (error) return cb(error, data, message)
    try {
      const products = data.resultProducts
      statusMarker(req, products)
      return cb(error, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // like a specific product
  async likeProduct(req, cb) {
    const { error, data, message } = await LikeService.likeProduct(req)
    return cb(error, message, data)
  }

  // unlike a specific product
  async unlikeProduct(req, cb) {
    const { error, data, message } = await LikeService.unlikeProduct(req)
    return cb(error, message, data)
  }

  // get all products from each category
  async getProductsFromCategories(req, cb) {
    const { error, data, message } = await CategoryService.getProductsFromCategories(req)

    if (error) return cb(error, data, message)
    try {
      const resultSets = data
      resultSets.forEach(set => {
        const products = set.ownedProducts
        statusMarker(req, products)
      })
      return cb(error, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
