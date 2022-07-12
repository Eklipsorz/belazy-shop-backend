const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable
const { Product, User, Reply } = require('../../db/models')
const { AuthToolKit } = require('../../utils/auth-tool-kit')

class ReplyResourceValidator {
  static async getReplies(req) {
    // check whether the product exists
    return await ReplyResourceValidator.existProductValidate(req)
  }

  static async postReplies(req) {
    // check whether the product exists
    return await ReplyResourceValidator.existProductValidate(req)
  }

  static async deleteReply(req) {
    const result = await ReplyResourceValidator.existReplyValidate(req)
    const { reply } = result.data

    const loginUser = AuthToolKit.getUser(req)
    if (reply.userId !== loginUser.id) {
      throw new APIError({ code: code.FORBIDDEN, message: '只能刪除自己的留言' })
    }
    return result
  }

  static async putReply(req) {
    const result = await ReplyResourceValidator.existReplyValidate(req)
    const { reply } = result.data

    const loginUser = AuthToolKit.getUser(req)
    if (reply.userId !== loginUser.id) {
      throw new APIError({ code: code.FORBIDDEN, message: '只能編輯自己的留言' })
    }

    return result
  }

  static async existReplyValidate(req) {
    const { replyId } = req.params
    const reply = await Reply.findByPk(replyId)
    if (!reply) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    const resultData = { reply }
    return { data: resultData }
  }

  static async existProductValidate(req) {
    // check whether the product exists
    const { productId } = req.params

    const product = await Product.findByPk(productId)
    if (!product) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    const resultData = { product }
    return { data: resultData }
  }
}

exports = module.exports = {
  ReplyResourceValidator
}
