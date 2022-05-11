const { APIError } = require('../../helpers/api-error')
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Like, ProductStatistic, UserStatistic } = require('../../db/models')

class LikeResource {
  static async likeProduct(req) {
    try {
      // current login user
      const loginUser = AuthToolKit.getUser(req)
      const { productId } = req.params

      // check whether a specific product exists
      const product = await Product.findByPk(productId)

      // return error if nothing to find
      if (!product) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }
      // check whether the user has repeatedly liked the same product
      // return error if it's true
      const findLikeOption = {
        where: { userId: loginUser.id, productId }
      }

      const [like, created] = await Like.findOrCreate(findLikeOption)
      if (!created) {
        return { error: new APIError({ code: code.FORBIDDEN, status, message: '使用者不能重複喜歡同個產品' }) }
      }
      // user can like product

      // update likeTally to user statistic
      const findUserStatOption = {
        where: { userId: loginUser.id },
        attributes: ['id', 'userId', 'likeTally', 'createdAt', 'updatedAt']
      }

      const findUserStatResult = await UserStatistic.findOne(findUserStatOption)
      let userStatistic = await findUserStatResult.increment('likeTally')

      // update likedTally to product statistic
      const findProductStatOption = {
        where: { productId },
        attributes: ['id', 'productId', 'likedTally', 'createdAt', 'updatedAt']
      }

      const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
      let productStatistic = await findProductStatResult.increment('likedTally')

      // return success response
      userStatistic = userStatistic.toJSON()
      productStatistic = productStatistic.toJSON()

      const resultObject = {
        like: { userId: like.userId, productId: like.productId },
        userStatistic: { ...userStatistic, likeTally: userStatistic.likeTally + 1 },
        productStatistic: { ...productStatistic, likedTally: productStatistic.likedTally + 1 }
      }
      return { error: null, data: resultObject, message: '喜歡成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async unlikeProduct(req) {
    try {
      // current login user
      const loginUser = AuthToolKit.getUser(req)
      const { productId } = req.params

      // check whether a specific product exists
      const product = await Product.findByPk(productId)

      // return error if nothing to find
      if (!product) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }

      // check whether the user has repeatedly liked the same product
      // return error if it's true
      const findUnlikeOption = {
        where: {
          userId: loginUser.id,
          productId
        }
      }
      const like = await Like.findOne(findUnlikeOption)

      if (!like) {
        return { error: new APIError({ code: code.UNAUTHORIZED, status, message: '使用者不能取消從未喜歡過的產品' }) }
      }

      // user can unlike product
      await like.destroy()

      // update likeTally to user statistic
      const findUserStatOption = {
        where: { userId: loginUser.id },
        attributes: ['id', 'userId', 'likeTally', 'createdAt', 'updatedAt']
      }

      const findUserStatResult = await UserStatistic.findOne(findUserStatOption)
      let userStatistic = await findUserStatResult.decrement('likeTally')

      // update likedTally to product statistic
      const findProductStatOption = {
        where: { productId },
        attributes: ['id', 'productId', 'likedTally', 'createdAt', 'updatedAt']
      }

      const findProductStatResult = await ProductStatistic.findOne(findProductStatOption)
      let productStatistic = await findProductStatResult.decrement('likedTally')

      // return success response
      userStatistic = userStatistic.toJSON()
      productStatistic = productStatistic.toJSON()

      const resultObject = {
        like: { userId: like.userId, productId: like.productId },
        userStatistic: { ...userStatistic, likeTally: userStatistic.likeTally - 1 },
        productStatistic: { ...productStatistic, likedTally: productStatistic.likedTally - 1 }
      }
      return { error: null, data: resultObject, message: '取消喜歡成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  LikeResource
}
