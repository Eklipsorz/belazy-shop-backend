const validator = require('validator')
const { Reply } = require('../db/models')
const { APIError } = require('../helpers/api-error')
const { MAX_LENGTH_CONTENT, MIN_LENGTH_CONTENT } = require('../config/app').service.replyResource
const { status, code } = require('../config/result-status-table').errorTable

class ReplyToolKit {
  // check whether the reply exists
  static async replyGetter(replyId) {
    const reply = await Reply.findByPk(replyId)
    if (!reply) {
      return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
    }
    return reply
  }

  // return replies with product (i.e., productId)
  static async getRepliesByProduct(productId) {
    const findOption = {
      where: { productId }
    }
    const Replies = await Reply.findAll(findOption)
    return Replies
  }

  // return users who replies to product (i.e., productId)
  static async getReplyUserByProduct(productId) {
    const findOption = {
      where: { productId },
      attributes: ['userId'],
      group: 'userId',
      raw: true
    }
    const users = await Reply.findAll(findOption)
    return users
  }

  static replyContentValidate(req) {
    const messageQueue = []
    const { content } = req.body
    const minLength = MIN_LENGTH_CONTENT
    const maxLength = MAX_LENGTH_CONTENT

    if (!validator.isLength(content, { min: minLength, max: maxLength })) {
      messageQueue.push(`留言字數範圍得為：${minLength} - ${maxLength} 字`)
    }
    return messageQueue
  }
}

exports = module.exports = {
  ReplyToolKit
}
