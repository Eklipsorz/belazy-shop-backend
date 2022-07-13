
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Reply, UserStatistic, ProductStatistic } = require('../../db/models')

const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { ReplyToolKit } = require('../../utils/reply-tool-kit')
const { User, Product } = require('../../db/models')

class ReplyResource {
  static async existReplyValidate(req) {
    const { replyId } = req.params
    const reply = await Reply.findByPk(replyId)
    if (!reply) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    const loginUser = AuthToolKit.getUser(req)

    if (reply.userId !== loginUser.id) {
      throw new APIError({ code: code.FORBIDDEN, message: '只能存取自己的留言' })
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

  static async getReplies(req) {
    await ReplyResource.existProductValidate(req)
    const { productId } = req.params
    const { limit, offset, order, page } = req.query
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
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應產品的留言' })
    }

    const resultReplies = replies.map(reply => reply.toJSON())

    // return data
    return { error: null, data: { currentPage: page, resultReplies }, message: '獲取成功' }
  }

  static async getReply(req) {
    const { replyId } = req.params

    const findOption = {
      include: [
        { model: User, attributes: ['avatar', 'nickname'], as: 'user' }
      ]
    }
    const reply = await Reply.findByPk(replyId, findOption)
    if (!reply) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }

    const resultReply = reply.toJSON()
    return { error: null, data: resultReply, message: '獲取成功' }
  }

  static async postReplies(req) {
    await ReplyResource.existProductValidate(req)
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

  static async deleteReply(req) {
    try {
      const result = await ReplyResource.existReplyValidate(req)
      const loginUser = AuthToolKit.getUser(req)
      const { reply } = result.data

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

  static async putReply(req) {
    const result = await ReplyResource.existReplyValidate(req)
    const { reply } = result.data

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
