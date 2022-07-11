const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { ProductStatistic, UserStatistic } = require('../../db/models')

class LikeResource {
  static async likeProduct(req, data) {
    // user can like product
    const loginUser = AuthToolKit.getUser(req)
    const { productId } = req.params
    const like = data
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
