const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const stripe = require('stripe')(process.env.STRIPE_BACKEND_APIKEY)

const { UserStatistic } = require('../../db/models')
const { AuthToolKit } = require('../../utils/auth-tool-kit')

const { APIError } = require('../../helpers/api-error')

const { code } = require('../../config/result-status-table').errorTable
const { ProductToolKit } = require('../../utils/product-tool-kit')
const { CartResource } = require('../resources/cart')
const { RedisLock } = require('../db/redisLock')
const { v4: uuidv4 } = require('uuid')
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')
const { DEFAULT_LOCKNAME } = require('../../config/app').service.redisLock

class PurchaseResource {
  static async purchaseTask(req, quantityHashMap, stockHashMap) {
    // calculate total amount
    const { items, stripeToken } = req.body
    const redisClient = req.app.locals.redisClient
    const { getProductTotalPrice } = ProductToolKit
    const result = {}
    let amount = 0

    for (const item of items) {
      const { productId, quantity } = item
      const productTotal = await getProductTotalPrice(req, productId, quantity)
      amount += productTotal
    }

    // charge
    await stripe.charges.create({
      amount,
      source: stripeToken,
      currency: 'usd'
    })

    // update stock
    const map = Object.entries(quantityHashMap)

    for (const [productId, quantity] of map) {
      const stockKey = `stock:${productId}`
      const template = {
        ...stockHashMap[productId],
        restQuantity: Number(stockHashMap[productId].restQuantity) - Number(quantity),
        updatedAt: new Date(),
        dirtyBit: 1
      }

      await redisClient.hset(stockKey, template)
    }

    return { error: false, result }
  }

  static async postPurchase(from, req, data) {
    const redisClient = req.app.locals.redisClient
    const redisLock = new RedisLock(redisClient)
    const lockId = uuidv4()

    try {
      const { isInvalidFormat } = ParameterValidationKit
      const { getQuantityHashMap } = ProductToolKit
      // check whether stock is enough
      let { items } = req.body
      if (!Array.isArray(items)) req.body.items = items = [items]
      const quantityHashMap = isInvalidFormat(data) ? getQuantityHashMap(items) : data.quantityHashMap
      const keys = Object.keys(quantityHashMap)

      await redisLock.lock(DEFAULT_LOCKNAME, lockId)
      const { getStock, checkStockStatus } = ProductToolKit

      const stockHashMap = await getStock(keys, redisClient)
      const { soldOut, notEnough } = checkStockStatus(quantityHashMap, stockHashMap)
      const stockError = Boolean(soldOut.length) || Boolean(notEnough.length)

      if (stockError) {
        await redisLock.unlock(DEFAULT_LOCKNAME, lockId)
        throw new APIError({ code: code.BADREQUEST, data: { soldOut, notEnough }, message: '庫存問題' })
      }

      // if error
      const { purchaseTask } = PurchaseResource

      await Promise.race([
        purchaseTask(req, quantityHashMap, stockHashMap),
        redisLock.refresh(DEFAULT_LOCKNAME, lockId)
      ])

      await redisLock.unlock(DEFAULT_LOCKNAME, lockId)

      // sync cart or something else
      switch (from) {
        case 'cart':
          await CartResource.deleteCart(req)
          break
        case 'page':
          break
      }
      // update UserStatistic for buyer
      const currentUser = AuthToolKit.getUser(req)
      const updateOption = { where: { userId: currentUser.id } }
      await UserStatistic.increment('orderTally', updateOption)

      const resultPurchase = null
      return { error: null, data: resultPurchase, message: '購買成功' }
    } catch (error) {
      await redisLock.unlock(DEFAULT_LOCKNAME, lockId)
      switch (error.type) {
        case 'StripeInvalidRequestError':
          throw new APIError({ code: error.raw.statusCode, message: '目前付款資訊無法正常付款' })
        default:
          throw new APIError({ code: code.SERVERERROR, message: error.message })
      }
    }
  }
}

exports = module.exports = {
  PurchaseResource
}
