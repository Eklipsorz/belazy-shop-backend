const { Like } = require('../db/models')

class LikeToolKit {
  static async getLikesyProduct(productId) {
    const findOption = {
      where: { productId }
    }
    const likes = await Like.findAll(findOption)
    return likes
  }
}

exports = module.exports = {
  LikeToolKit
}
