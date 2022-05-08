const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')
const { CategoryService } = require('../resources/category')
const { userService } = require('../../config/app').service
const { APIError } = require('../../helpers/api-error')
const { code, status } = require('../../config/result-status-table').errorTable
const Fuse = require('fuse.js')

const { getUser } = require('../../helpers/auth-user-getter')

// 標記是否喜歡或者是否評論過
function statusMarker(req, products) {
  const loginUser = getUser(req)

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

  async getSearchHints(req, cb) {
    const { error, data, message } = await ProductService.getSearchHints(req)
    if (error) return cb(error, data, message)

    try {
      const hintNumber = userService.SEARCH_HINT_NUMBER
      const results = data.slice(0, hintNumber)
      return cb(error, results, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  async searchProduct(req, cb) {
    try {
      const { keyword, by, page, limit, offset } = req.query
      const { AVABILABLE_BY_OPTION } = userService
      const matchingType = by.toLowerCase()
      // check whether keyword is empty
      if (!keyword) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: '關鍵字為空' }))
      }

      // check whether by is empty
      if (!matchingType) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為空' }))
      }

      // check whether by is correct
      if (!AVABILABLE_BY_OPTION.includes(matchingType)) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為錯誤' }))
      }

      const { error, data, message } = await ProductService.getProducts(req, 'search')
      if (error) return cb(error, data, message)
      let result = ''

      switch (matchingType) {
        case 'relevancy':
          result = fuzzySearch(data, keyword)
          break
        case 'accuracy':
          result = exactSearch(data, keyword)
          break
      }
      const resultProducts = result.slice(offset, offset + limit)
      statusMarker(req, resultProducts)
      return cb(null, { currentPage: page, resultProducts }, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }

    function fuzzySearch(data, keyword) {
      const fuseOptions = {
        keys: ['name']
      }
      const products = data.resultProducts
      const fuse = new Fuse(products, fuseOptions)
      const fuseResults = fuse.search(keyword)

      return fuseResults.map(fr => fr.item)
    }

    function exactSearch(data, keyword) {
      const products = data.resultProducts
      return products.filter(p => p.name === keyword)
    }
  }

  async searchCategory(req, cb) {
    console.log('hi this user service')
    // const { error, data, message } = await CategoryService.getCategory(req)
    // return cb(error, data, message)
  }

  async getCategory(req, cb) {
    console.log('this category id')
    await CategoryService.getCategory(req)
  }

  async getCategories(req, cb) {
    const { error, data, message } = await CategoryService.getCategories(req)
    return cb(error, data, message)
  }
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
