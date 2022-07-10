const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const { APIError } = require('../../helpers/api-error')
const { CartToolKit } = require('../../utils/cart-tool-kit')
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { ProductToolKit } = require('../../utils/product-tool-kit')

const { PREFIX_CARTITEM_KEY, PREFIX_CART_KEY } = require('../../config/app').cache.CART
const { code } = require('../../config/result-status-table').errorTable

class CartResourceValidator {
  // check whether the cart is empty
  static async getCart(req) {
    const redisClient = req.app.locals.redisClient
    const { cartId } = req.session
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`

    const cart = await redisClient.hgetall(cartKey)

    const existCart = Boolean(Object.keys(cart).length) && Boolean(cart.sum !== '0')
    if (!existCart) {
      throw new APIError({ code: code.NOTFOUND, message: '購物車是空的' })
    }
    const resultData = cart
    return { data: resultData }
  }

  // check whether there is something in the cart
  static async getCartItems(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient
    const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`

    const getCacheValues = RedisToolKit.getCacheValues
    const cart = await getCacheValues(cartKeyPattern, redisClient)
    // if none
    if (CartToolKit.isEmptyCart(cart)) {
      throw new APIError({ code: code.NOTFOUND, message: '購物車是空的' })
    }

    const resultData = cart
    return { data: resultData }
  }

  static async postCartItems(req) {
    const { productId } = req.body
    const redisClient = req.app.locals.redisClient
    const productKey = `product:${productId}`
    // check whether parameter syntax is correct
    const { error, result } = CartToolKit.cartItemSyntaxValidate(req)
    if (error) {
      throw new APIError({ code: result.code, message: result.message })
    }
    // check whether product exists in product
    const product = await redisClient.hgetall(productKey)
    // nothing
    if (!Object.keys(product).length) {
      throw new APIError({ code: code.NOTFOUND, message: '找不到對應項目' })
    }

    // I've found that
    // check whether the stock is enough
    const { cartId } = req.session
    const cartKey = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
    const cartItem = await redisClient.hgetall(cartKey)
    const isExistCart = Boolean(Object.keys(cartItem).length) && Boolean(Number(cartItem.quantity))

    const quantity = isExistCart ? Number(cartItem.quantity) + 1 : 1

    const cartHashMap = {}
    cartHashMap[productId] = quantity

    const stockHashMap = await ProductToolKit.getStock(productId, redisClient)
    const { soldOut, notEnough } = await ProductToolKit.checkStockStatus(cartHashMap, stockHashMap)
    const stockError = Boolean(soldOut.length) || Boolean(notEnough.length)

    // if not enough, just say sorry and return
    if (stockError) {
      throw new APIError({ code: code.BADREQUEST, data: { soldOut, notEnough }, message: '庫存問題' })
    }

    const resultData = { stockHashMap, cartItem }
    return { data: resultData }
  }

  static async deleteCart(req) {
    // check whether there is something inside the cart

    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const cartKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
    const cart = await RedisToolKit.getCacheValues(cartKeyPattern, redisClient)

    // if none, then
    if (CartToolKit.isEmptyCart(cart)) {
      throw new APIError({ code: code.NOTFOUND, message: '購物車是空的' })
    }

    const resultData = cart
    return { data: resultData }
  }
}

exports = module.exports = {
  CartResourceValidator
}
