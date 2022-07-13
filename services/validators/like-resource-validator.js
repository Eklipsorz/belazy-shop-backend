const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable
const { Product, Like } = require('../../db/models')

class LikeResourceValidator {
  static async likeProduct(req) {
    const { productId } = req.params

    // check whether a specific product exists
    const product = await Product.findByPk(productId)

    // return error if nothing to find
    if (!product) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }

    const resultData = null
    return { data: resultData }
  }

  static async unlikeProduct(req) {
    const { productId } = req.params

    // check whether a specific product exists
    const product = await Product.findByPk(productId)

    // return error if nothing to find
    if (!product) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }

    const resultData = null
    return { data: resultData }
  }
}

exports = module.exports = {
  LikeResourceValidator
}
