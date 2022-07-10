const { AccountService } = require('./account')
const { ProductResource } = require('../resources/product')
const { CategoryResource } = require('../resources/category')
const { LikeResource } = require('../resources/like')
const { ReplyResource } = require('../resources/reply')
const { CartResource } = require('../resources/cart')
const { OrderResource } = require('../resources/order')
const { PurchaseResource } = require('../resources/purchase')

const { PurchaseResourceValidator } = require('../validators/purchase-resource-validator')
const { CartResourceValidator } = require('../validators/cart-resource-validator')
const { OrderResourceValidator } = require('../validators/order-resource-validator')
const { userService } = require('../../config/app').service
const { APIError } = require('../../helpers/api-error')
const { code, status } = require('../../config/result-status-table').errorTable
const { AuthToolKit } = require('../../utils/auth-tool-kit')
const { SearchResource } = require('../resources/search')

// isLiked & isReplied status marker for each product
function statusMarker(req, products) {
  const loginUser = AuthToolKit.getUser(req)
  if (!loginUser) return

  products = Array.isArray(products) ? products : [products]
  const likedProducts = loginUser.likedProducts
  const repliedProducts = loginUser.repliedProducts

  products.forEach(product => {
    product.isLiked = likedProducts.some(lp => lp.productId === product.id)
    product.isReplied = repliedProducts.some(rp => rp.productId === product.id)
  })
}

class UserService extends AccountService {
  constructor() {
    super('user')
  }

  // get all products
  async getProducts(req, cb) {
    const { error, data, message } = await ProductResource.getProducts(req, 'get')
    if (error) return cb(error, data, message)

    try {
      const products = data.resultProducts
      statusMarker(req, products)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get a specific product
  async getProduct(req, cb) {
    const { error, data, message } = await ProductResource.getProduct(req)

    if (error) return cb(error, data, message)
    try {
      const product = data
      statusMarker(req, product)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  async getProductSnapshot(req, cb) {
    const { error, data, message } = await ProductResource.getProductSnapshot(req)
    return cb(error, data, message)
  }

  async getStock(req, cb) {
    const { error, data, message } = await ProductResource.getStock(req)
    return cb(error, data, message)
  }

  // get search hint when user input something in search bar
  async getSearchHints(req, cb) {
    const { error, data, message } = await SearchResource.getSearchHints(req)
    if (error) return cb(error, data, message)

    try {
      const hintNumber = userService.SEARCH_HINT_NUMBER
      const results = data.slice(0, hintNumber)
      return cb(error, results, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // search product with a specific product name
  async searchProducts(req, cb) {
    const { error, data, message } = await SearchResource.searchProducts(req)
    if (error) return cb(error, data, message)
    try {
      const resultProducts = data.resultProducts
      // mark isLiked & isReplied
      statusMarker(req, resultProducts)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // search products with a specific category
  async searchProductsFromCategory(req, cb) {
    const { error, data, message } = await SearchResource.searchProductsFromCategory(req)
    if (error) return cb(error, data, message)
    try {
      const resultProducts = data.resultProducts
      // mark isLiked & isReplied
      statusMarker(req, resultProducts)
      return cb(null, data, '獲取成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get a specific category
  async getCategory(req, cb) {
    const { error, data, message } = await CategoryResource.getCategory(req)
    return cb(error, data, message)
  }

  // get all categories
  async getCategories(req, cb) {
    const { error, data, message } = await CategoryResource.getCategories(req)
    return cb(error, data, message)
  }

  // get all products from a specific category
  async getProductsFromCategory(req, cb) {
    const { error, data, message } = await CategoryResource.getProductsFromCategory(req)
    if (error) return cb(error, data, message)
    try {
      const products = data.resultProducts
      statusMarker(req, products)
      return cb(error, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // like a specific product
  async likeProduct(req, cb) {
    const { error, data, message } = await LikeResource.likeProduct(req)
    return cb(error, message, data)
  }

  // unlike a specific product
  async unlikeProduct(req, cb) {
    const { error, data, message } = await LikeResource.unlikeProduct(req)
    return cb(error, message, data)
  }

  // get all products from each category
  async getProductsFromCategories(req, cb) {
    const { error, data, message } = await CategoryResource.getProductsFromCategories(req)

    if (error) return cb(error, data, message)
    try {
      const resultSets = data
      resultSets.forEach(set => {
        const products = set.ownedProducts
        statusMarker(req, products)
      })
      return cb(error, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  async getReplies(req, cb) {
    const { error, data, message } = await ReplyResource.getReplies(req)
    return cb(error, data, message)
  }

  async getReply(req, cb) {
    const { error, data, message } = await ReplyResource.getReply(req)
    return cb(error, data, message)
  }

  async postReplies(req, cb) {
    const { error, data, message } = await ReplyResource.postReplies(req)
    return cb(error, data, message)
  }

  async deleteReply(req, cb) {
    const { error, data, message } = await ReplyResource.deleteReply(req)
    return cb(error, data, message)
  }

  async putReply(req, cb) {
    const { error, data, message } = await ReplyResource.putReply(req)
    return cb(error, data, message)
  }

  async getCart(req, cb) {
    try {
      const result = await CartResourceValidator.getCart(req)

      const { error, data, message } = await CartResource.getCart(req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getCartItems(req, cb) {
    try {
      const result = await CartResourceValidator.getCartItems(req)
      const { error, data, message } = await CartResource.getCartItems(req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async putCartItems(req, cb) {
    const { error, data, message } = await CartResource.putCartItems(req)
    return cb(error, data, message)
  }

  async postCartItems(req, cb) {
    try {
      const result = await CartResourceValidator.postCartItems(req)
      const { error, data, message } = await CartResource.postCartItems(req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async deleteCartItem(req, cb) {
    const { error, data, message } = await CartResource.deleteCartItem(req)
    return cb(error, data, message)
  }

  async deleteCart(req, cb) {
    try {
      const result = await CartResourceValidator.deleteCart(req)
      const { error, data, message } = await CartResource.deleteCart(req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async postPagePurchase(req, cb) {
    try {
      req.body.items = [req.body.items]
      const result = await PurchaseResourceValidator.postPagePurchase(req)
      const { error, data, message } = await PurchaseResource.postPurchase('page', req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async postCartPurchase(req, cb) {
    try {
      const result = await PurchaseResourceValidator.postCartPurchase(req)
      const { error, data, message } = await PurchaseResource.postPurchase('cart', req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async postOrders(req, cb) {
    try {
      const result = await OrderResourceValidator.postOrders(req)
      const { error, data, message } = await OrderResource.postOrders(req, result.data)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getOrders(req, cb) {
    try {
      const currentUser = AuthToolKit.getUser(req)
      const { limit, offset, order } = req.query
      const findOption = {
        where: { userId: currentUser.id },
        limit,
        offset,
        order: [['createdAt', order]]
      }
      const option = { user: currentUser, findOption }

      const { error, data, message } = await OrderResource.getOrders(req, option)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }

  async getOrder(req, cb) {
    try {
      const { orderId } = req.params
      const currentUser = AuthToolKit.getUser(req)
      const findOption = {
        where: { userId: currentUser.id, id: orderId }
      }
      const option = { user: currentUser, findOption }
      const { error, data, message } = await OrderResource.getOrder(req, option)
      return cb(error, data, message)
    } catch (error) {
      return cb(error)
    }
  }
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
