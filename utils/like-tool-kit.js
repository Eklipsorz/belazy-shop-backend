const { Like, UserStatistic } = require('../db/models')

class LikeToolKit {
  static async getLikesByProduct(productId) {
    const findOption = {
      where: { productId }
    }
    const likes = await Like.findAll(findOption)
    return likes
  }

  static async getLikeUsersByProduct(productId) {
    const findOption = {
      where: { productId },
      attributes: ['userId'],
      group: 'userId',
      raw: true
    }
    const users = await Like.findAll(findOption)
    return users
  }

  static getUsersByLikeHashMap(likes) {
    const likeHashMap = {}
    for (const like of likes) {
      const userId = like.userId
      if (!likeHashMap[userId]) {
        likeHashMap[userId] = 0
      }
      likeHashMap[userId] += 1
    }
    const users = Object.entries(likeHashMap).map(([key, value]) => ({ userId: key, count: value }))
    return users
  }

  static async getUsersAndLikesByProduct(productId) {
    const { getLikesByProduct, getUsersByLikeHashMap } = LikeToolKit
    const likes = await getLikesByProduct(productId)
    const users = getUsersByLikeHashMap(likes)

    const result = { users, likes }
    return result
  }

  static async updateUserLikeTally({ users }) {
    for (const user of users) {
      const { userId, count } = user
      const updateOption = { where: { userId }, by: count }
      await UserStatistic.decrement('likeTally', updateOption)
    }
  }
}

exports = module.exports = {
  LikeToolKit
}
