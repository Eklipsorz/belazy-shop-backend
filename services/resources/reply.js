
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Reply, User } = require('../../db/models')
class ReplyResource {
  static async getReplies(req) {
    try {
      // check whether the product exists
      const { productId } = req.params
      const { page, limit, offset, order } = req.query
      const isExistProduct = await Product.findByPk(productId)

      if (!isExistProduct) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }
      // define how to find
      const findOption = {
        include: [
          { model: User, attributes: ['avatar', 'nickname'], as: 'user' }
        ],
        where: { productId },
        order: [['createdAt', order]],
        limit,
        offset
      }
      // begin to find
      const replies = await Reply.findAll(findOption)

      // nothing to find
      if (!replies.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應產品的留言' }) }
      }

      const resultReplies = replies.map(reply => reply.toJSON())

      // return data
      return { error: null, data: { currentPage: page, resultReplies }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ReplyResource
}
