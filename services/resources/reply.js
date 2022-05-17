
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Reply, User, UserStatistic, ProductStatistic } = require('../../db/models')
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { MAX_LENGTH_CONTENT } = require('../../config/app').service.replyResource

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

  static async postReplies(req) {
    try {
      // check whether the product exists
      const { productId } = req.params
      const { content } = req.body
      const isExistProduct = await Product.findByPk(productId)

      if (!isExistProduct) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }

      if (content.length > MAX_LENGTH_CONTENT) {
        return { error: new APIError({ code: code.BADREQUEST, status, message: '留言字數超過255字' }) }
      }
      // begin to add a reply
      const loginUser = AuthToolKit.getUser(req)

      const reply = await Reply.create({
        userId: loginUser.id,
        productId,
        content
      })
      // update replyTally for current user
      const findUserStatOption = {
        where: { userId: loginUser.id },
        attributes: ['id', 'userId', 'replyTally', 'createdAt', 'updatedAt']
      }

      const findUserStatResult = await UserStatistic.findOne(findUserStatOption)
      let userStatistic = await findUserStatResult.increment('replyTally')
      // update repliedTally for the product
      const findProductStatOption = {
        where: { productId },
        attributes: ['id', 'productId', 'repliedTally', 'createdAt', 'updatedAt']
      }

      const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
      let productStatistic = await findProductStatResult.increment('repliedTally')

      // return success response
      userStatistic = userStatistic.toJSON()
      productStatistic = productStatistic.toJSON()

      const resultObject = {
        reply: { ...reply.toJSON() },
        userStatistic: { ...userStatistic, replyTally: userStatistic.replyTally + 1 },
        productStatistic: { ...productStatistic, repliedTally: productStatistic.repliedTally + 1 }
      }

      return { error: null, data: resultObject, message: '留言成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async deleteReply(req) {
    try {
      const { replyId } = req.params

      // check whether the reply exists
      const reply = await Reply.findByPk(replyId)
      if (!reply) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }

      // check whether reply owner belongs to currnet user
      const loginUser = AuthToolKit.getUser(req)
      if (reply.userId !== loginUser.id) {
        return { error: new APIError({ code: code.FORBIDDEN, status, message: '只能刪除自己的留言' }) }
      }

      // begin to delete the reply
      const resultReply = await reply.destroy()

      // update replyTally for current user
      const findUserStatOption = {
        where: { userId: loginUser.id },
        attributes: ['id', 'userId', 'replyTally', 'createdAt', 'updatedAt']
      }

      const findUserStatResult = await UserStatistic.findOne(findUserStatOption)
      let userStatistic = await findUserStatResult.decrement('replyTally')

      // update repliedTally for the product
      const findProductStatOption = {
        where: { productId: reply.productId },
        attributes: ['id', 'productId', 'repliedTally', 'createdAt', 'updatedAt']
      }

      const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
      let productStatistic = await findProductStatResult.decrement('repliedTally')

      // return success response
      userStatistic = userStatistic.toJSON()
      productStatistic = productStatistic.toJSON()

      const resultObject = {
        reply: { ...resultReply.toJSON() },
        userStatistic: { ...userStatistic, replyTally: userStatistic.replyTally - 1 },
        productStatistic: { ...productStatistic, repliedTally: productStatistic.repliedTally - 1 }
      }

      return { error: null, data: resultObject, message: '移除成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ReplyResource
}
