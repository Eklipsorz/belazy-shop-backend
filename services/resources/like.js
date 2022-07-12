const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { ProductStatistic, UserStatistic, Like } = require('../../db/models')
const { code } = require('../../config/result-status-table').errorTable
const { APIError } = require('../../helpers/api-error')

class LikeResource {
  static async likeProduct(req, data) {
    // user can like product
    const loginUser = AuthToolKit.getUser(req)
    const { productId } = req.params
    const { findLikeOption } = data

    // check whether the user has repeatedly liked the same product
    // return error if it's true
    const [like, created] = await Like.findOrCreate(findLikeOption)
    if (!created) {
      throw new APIError({ code: code.FORBIDDEN, message: '使用者不能重複喜歡同個產品' })
    }

    // update likeTally to user statistic
    const findUserStatOption = {
      where: { userId: loginUser.id },
      attributes: ['id', 'userId', 'likeTally', 'createdAt', 'updatedAt']
    }

    const findUserStatResult = await UserStatistic.findOne(findUserStatOption)
    await findUserStatResult.increment('likeTally')

    // update likedTally to product statistic
    const findProductStatOption = {
      where: { productId },
      attributes: ['id', 'productId', 'likedTally', 'createdAt', 'updatedAt']
    }

    const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
    let productStatistic = await findProductStatResult.increment('likedTally')

    // return success response
    productStatistic = productStatistic.toJSON()
    delete productStatistic.id

    const resultObject = {
      like: { userId: like.userId, productId: like.productId },
      productStatistic: { ...productStatistic, likedTally: productStatistic.likedTally + 1 }
    }
    return { error: null, data: resultObject, message: '喜歡成功' }
  }

  static async unlikeProduct(req, data) {
    // user can unlike product
    const loginUser = AuthToolKit.getUser(req)
    const { productId } = req.params
    const like = data
    await like.destroy()

    // update likeTally to user statistic
    const findUserStatOption = {
      where: { userId: loginUser.id },
      attributes: ['id', 'userId', 'likeTally', 'createdAt', 'updatedAt']
    }

    const findUserStatResult = await UserStatistic.findOne(findUserStatOption)
    await findUserStatResult.decrement('likeTally')

    // update likedTally to product statistic
    const findProductStatOption = {
      where: { productId },
      attributes: ['id', 'productId', 'likedTally', 'createdAt', 'updatedAt']
    }

    const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
    let productStatistic = await findProductStatResult.decrement('likedTally')

    // return success response
    productStatistic = productStatistic.toJSON()
    delete productStatistic.id

    const resultObject = {
      like: { userId: like.userId, productId: like.productId },
      productStatistic: { ...productStatistic, likedTally: productStatistic.likedTally - 1 }
    }
    return { error: null, data: resultObject, message: '取消喜歡成功' }
  }
}

exports = module.exports = {
  LikeResource
}
