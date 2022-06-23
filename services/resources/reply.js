
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Reply, User, UserStatistic, ProductStatistic } = require('../../db/models')

const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { ReplyToolKit } = require('../../utils/reply-tool-kit')

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

  static async getReply(req) {
    try {
      const { replyId } = req.params

      const findOption = {
        include: [
          { model: User, attributes: ['avatar', 'nickname'], as: 'user' }
        ]
      }

      const reply = await Reply.findByPk(replyId, findOption)
      if (!reply) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }

      const resultReply = reply.toJSON()
      return { error: null, data: resultReply, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async postReplies(req) {
    try {
      // check whether the product exists
      const { productId } = req.params
      const isExistProduct = await Product.findByPk(productId)

      if (!isExistProduct) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }

      const { content } = req.body
      const message = ReplyToolKit.replyContentValidate(req)
      if (message.length) {
        return { error: new APIError({ code: code.BADREQUEST, status, message, data: { content } }) }
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

      const reply = await ReplyToolKit.replyGetter(replyId)

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

  static async putReply(req) {
    try {
      const { replyId } = req.params
      const reply = await ReplyToolKit.replyGetter(replyId)

      // check whether the reply owner is current user
      const loginUser = AuthToolKit.getUser(req)

      if (reply.userId !== loginUser.id) {
        return { error: new APIError({ code: code.FORBIDDEN, status, message: '只能編輯自己的留言' }) }
      }

      // begin to edit the reply
      const { content } = req.body
      const message = ReplyToolKit.replyContentValidate(req)
      if (message.length) {
        return { error: new APIError({ code: code.BADREQUEST, status, message, data: { content } }) }
      }

      // return success response

      const resultReply = await reply.update({ content })
      return { error: null, data: resultReply, message: '修改成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ReplyResource
}
