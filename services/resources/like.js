const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { ProductStatistic, UserStatistic, Like, Product } = require('../../db/models')
const { code } = require('../../config/result-status-table').errorTable
const { APIError } = require('../../helpers/api-error')

class LikeResource {
  // check whether a specific product exists
  static async existProductValidation(req) {
    const { productId } = req.params

    const product = await Product.findByPk(productId)

    // return error if nothing to find
    if (!product) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    const resultData = null
    return { data: resultData }
  }

  static async likeProduct(req) {
    // check whether a specific product exists
    await LikeResource.existProductValidation(req)
    const loginUser = AuthToolKit.getUser(req)
    const { productId } = req.params
    const findLikeOption = {
      where: { userId: loginUser.id, productId }
    }
    // check whether the user has repeatedly liked the same product
    // return error if it's true
    const [like, created] = await Like.findOrCreate(findLikeOption)
    if (!created) {
      throw new APIError({ code: code.FORBIDDEN, message: '使用者不能重複喜歡同個產品' })
    }
    // user can like product
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
    // check whether a specific product exists
    await LikeResource.existProductValidation(req)

    // user can unlike product
    const loginUser = AuthToolKit.getUser(req)

    const { productId } = req.params
    const findUnlikeOption = {
      where: {
        userId: loginUser.id,
        productId
      }
    }
    // check whether the user has repeatedly liked the same product
    // return error if it's true
    const like = await Like.findOne(findUnlikeOption)
    if (!like) {
      throw new APIError({ code: code.UNAUTHORIZED, message: '使用者不能取消從未喜歡過的產品' })
    }
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
