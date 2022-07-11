const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable
const { Product, Like } = require('../../db/models')

class LikeResourceValidator {
  static async likeProduct(req) {
    // current login user
    const loginUser = AuthToolKit.getUser(req)
    const { productId } = req.params

    // check whether a specific product exists
    const product = await Product.findByPk(productId)

    // return error if nothing to find
    if (!product) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }
    // check whether the user has repeatedly liked the same product
    // return error if it's true
    const findLikeOption = {
      where: { userId: loginUser.id, productId }
    }

    const [like, created] = await Like.findOrCreate(findLikeOption)
    if (!created) {
      throw new APIError({ code: code.FORBIDDEN, message: '使用者不能重複喜歡同個產品' })
    }
    const resultData = like
    return { data: resultData }
  }

  static async unlikeProduct(req) {
    // current login user
    const loginUser = AuthToolKit.getUser(req)
    const { productId } = req.params

    // check whether a specific product exists
    const product = await Product.findByPk(productId)

    // return error if nothing to find
    if (!product) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
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
      throw new APIError({ code: code.UNAUTHORIZED, message: '使用者不能取消從未喜歡過的產品' })
    }

    const resultData = like
    return { data: resultData }
  }
}

exports = module.exports = {
  LikeResourceValidator
}
