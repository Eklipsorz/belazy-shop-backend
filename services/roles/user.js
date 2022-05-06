const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')
const { userService } = require('../../config/app').service
const { Like, Reply } = require('../../db/models')
const { APIError } = require('../../helpers/api-error')
const { code, status } = require('../../config/result-status-table').errorTable
const Fuse = require('fuse.js')

const { getUserId } = require('../../helpers/auth-user-getter')

class UserService extends AccountService {
  constructor() {
    super('user')
  }

  async getProducts(req, cb) {
    const { error, data, message } = await ProductService.getProducts(req, 'get')
    if (error) return cb(error, data, message)

    try {
      const products = data.resultProducts
      const loginUserId = getUserId(req)
      // 獲取當前使用者所喜歡的產品清單
      const likedProducts = await Like.findAll({
        attributes: ['productId'],
        where: { userId: loginUserId },
        raw: true
      })

      // 獲取當前使用者所評論的產品清單
      const repliedProducts = await Reply.findAll({
        attributes: ['productId'],
        where: { userId: loginUserId },
        raw: true
      })
      // 將所有產品資訊整理好可回傳的形式
      products.forEach(product => {
        product.isLiked = likedProducts.some(lp => lp.productId === product.id)
        product.isReplied = repliedProducts.some(rp => rp.productId === product.id)
      })

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
      const loginUserId = getUserId(req)
      // 獲取當前使用者所喜歡的產品清單
      const likedProducts = await Like.findAll({
        attributes: ['productId'],
        where: { userId: loginUserId },
        raw: true
      })

      // 獲取當前使用者所評論的產品清單
      const repliedProducts = await Reply.findAll({
        attributes: ['productId'],
        where: { userId: loginUserId },
        raw: true
      })

      product.isLiked = likedProducts.some(lp => lp.productId === product.id)
      product.isReplied = repliedProducts.some(rp => rp.productId === product.id)

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
      // check whether keyword is empty
      if (!keyword) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: '關鍵字為空' }))
      }

      // check whether by is empty
      if (!by) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為空' }))
      }

      // check whether by is correct
      if (!AVABILABLE_BY_OPTION.includes(by.toLowerCase())) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為錯誤' }))
      }

      const { error, data, message } = await ProductService.getProducts(req, 'search')
      if (error) return cb(error, data, message)
      let result = ''

      switch (by) {
        case 'relevancy':
          result = fuzzySearch(data, keyword)
          break
        case 'accuracy':
          result = exactSearch(data, keyword)
          break
      }
      const resultProducts = result.slice(offset, offset + limit)
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
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
