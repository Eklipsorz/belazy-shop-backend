const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')
const { Like, Reply } = require('../../db/models')
const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable

const { getUserId } = require('../../helpers/auth-user-getter')

class UserService extends AccountService {
  constructor() {
    super('user')
    // this.getProducts = ProductService.getProducts
  }

  async getProducts(req, cb) {
    const { error, data, message } = await ProductService.getProducts(req)
    if (error) return cb(error, data, message)

    try {
      const products = data.resultProduct
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
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
