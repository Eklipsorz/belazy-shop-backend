
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Reply, User, UserStatistic, ProductStatistic } = require('../../db/models')

const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { ReplyToolKit } = require('../../utils/reply-tool-kit')

class ReplyResource {
  static async getReplies(req, data) {
    const { page } = req.query
    // define how to find
    const { findOption } = data

    // begin to find
    const replies = await Reply.findAll(findOption)

    // nothing to find
    if (!replies.length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應產品的留言' })
    }

    const resultReplies = replies.map(reply => reply.toJSON())

    // return data
    return { error: null, data: { currentPage: page, resultReplies }, message: '獲取成功' }
  }

  static async getReply(req, data) {
    const { replyId } = req.params
    const { findOption } = data
    const reply = await Reply.findByPk(replyId, findOption)
    if (!reply) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }

    const resultReply = reply.toJSON()
    return { error: null, data: resultReply, message: '獲取成功' }
  }

  static async postReplies(req, data) {
    const { productId } = req.params
    const message = ReplyToolKit.replyContentValidate(req)
    const { content } = req.body
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
    await findUserStatResult.increment('replyTally')
    // update repliedTally for the product
    const findProductStatOption = {
      where: { productId },
      attributes: ['id', 'productId', 'repliedTally', 'createdAt', 'updatedAt']
    }

    const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
    let productStatistic = await findProductStatResult.increment('repliedTally')

    // return success response
    productStatistic = productStatistic.toJSON()

    const resultObject = {
      reply: { ...reply.toJSON() },
      productStatistic: { ...productStatistic, repliedTally: productStatistic.repliedTally + 1 }
    }

    return { error: null, data: resultObject, message: '留言成功' }
  }

  static async deleteReply(req, data) {
    try {
      const loginUser = AuthToolKit.getUser(req)
      const { reply } = data

      // begin to delete the reply
      const resultReply = await reply.destroy()

      // update replyTally for current user
      const findUserStatOption = {
        where: { userId: loginUser.id },
        attributes: ['id', 'userId', 'replyTally', 'createdAt', 'updatedAt']
      }

      const findUserStatResult = await UserStatistic.findOne(findUserStatOption)
      await findUserStatResult.decrement('replyTally')

      // update repliedTally for the product
      const findProductStatOption = {
        where: { productId: reply.productId },
        attributes: ['id', 'productId', 'repliedTally', 'createdAt', 'updatedAt']
      }

      const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
      let productStatistic = await findProductStatResult.decrement('repliedTally')

      // return success response
      productStatistic = productStatistic.toJSON()

      const resultObject = {
        reply: { ...resultReply.toJSON() },
        productStatistic: { ...productStatistic, repliedTally: productStatistic.repliedTally - 1 }
      }

      return { error: null, data: resultObject, message: '移除成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async putReply(req, data) {
    // const { replyId } = req.params
    // const reply = await ReplyToolKit.replyGetter(replyId)

    // // check whether the reply owner is current user
    // const loginUser = AuthToolKit.getUser(req)

    // if (reply.userId !== loginUser.id) {
    //   return { error: new APIError({ code: code.FORBIDDEN, status, message: '只能編輯自己的留言' }) }
    // }

    const { reply } = data
    // begin to edit the reply
    const message = ReplyToolKit.replyContentValidate(req)
    const { content } = req.body
    if (message.length) {
      throw new APIError({ code: code.BADREQUEST, message, data: { content } })
    }

    // return success response

    const resultReply = await reply.update({ content })
    return { error: null, data: resultReply, message: '修改成功' }
  }
}

exports = module.exports = {
  ReplyResource
}
