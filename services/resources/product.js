
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { getUserId } = require('../../helpers/auth-user-getter')
const {
  Product, Ownership, Stock,
  ProductStatistic, Like, Reply
} = require('../../db/models')
class ProductService {
  static async getProducts(req, cb) {
    try {
      const { page, limit, offset, order } = req.query
      const loginUserId = getUserId(req)
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

      if (!products.length) { return cb(new APIError({ code: code.NOTFOUND, status, message: '找不到產品' })) }

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
      const resultProduct = products.map(product => ({
        ...product.toJSON(),
        isLiked: likedProducts.some(lp => lp.productId === product.id),
        isReplied: repliedProducts.some(rp => rp.productId === product.id)
      }))

      return cb(null, { currentPage: page, resultProduct }, '獲取成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, message: error.message }))
    }
  }
}

exports = module.exports = {
  ProductService
}
