const validator = require('validator')
const { ParameterValidationKit } = require('./parameter-validation-kit')
const { Reply, UserStatistic } = require('../db/models')
const { MAX_LENGTH_CONTENT, MIN_LENGTH_CONTENT } = require('../config/app').service.replyResource

class ReplyToolKit {
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

  static async getUsersAndRepliesByProduct(productId) {
    const { getRepliesByProduct, getUsersByReplyHashMap } = ReplyToolKit
    const replies = await getRepliesByProduct(productId)
    const users = getUsersByReplyHashMap(replies)

    const result = { users, replies }
    return result
  }

  static getUsersByReplyHashMap(replies) {
    const replyHashMap = {}
    for (const reply of replies) {
      const userId = reply.userId
      if (!replyHashMap[userId]) {
        replyHashMap[userId] = 0
      }
      replyHashMap[userId] += 1
    }

    const users = Object.entries(replyHashMap).map(([key, value]) => ({ userId: key, count: value }))
    return users
  }

  static async updateUserReplyTally({ users }) {
    for (const user of users) {
      const { userId, count } = user
      const updateOption = { where: { userId }, by: count }
      await UserStatistic.decrement('replyTally', updateOption)
    }
  }

  static replyContentValidate(req) {
    const messageQueue = []
    let { content } = req.body
    const minLength = MIN_LENGTH_CONTENT
    const maxLength = MAX_LENGTH_CONTENT
    const { isInvalidFormat } = ParameterValidationKit

    if (isInvalidFormat(content)) req.body.content = content = ''

    if (!validator.isLength(content, { min: minLength, max: maxLength })) {
      messageQueue.push(`留言字數範圍得為：${minLength} - ${maxLength} 字`)
    }
    return messageQueue
  }
}

exports = module.exports = {
  ReplyToolKit
}
