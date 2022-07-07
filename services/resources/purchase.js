const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const stripe = require('stripe')(process.env.STRIPE_BACKEND_APIKEY)
const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable
const { ProductToolKit } = require('../../utils/product-tool-kit')
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
    let result = {}
    let amount = 0

    for (const item of items) {
      const { productId, quantity } = item
      const productTotal = await getProductTotalPrice(req, productId, quantity)
      amount += productTotal
    }

    // charge
    const chargeResult = await stripe.charges.create({
      amount,
      source: stripeToken,
      currency: 'usd'
    })

    if (chargeResult instanceof Error) {
      result = { code: code.FORBIDDEN, data: null, message: '目前付款資訊無法正常付款' }
      return { error: true, result }
    }

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

  static async postPurchase(req) {
    const redisClient = req.app.locals.redisClient
    const redisLock = new RedisLock(redisClient)
    const lockId = uuidv4()

    try {
      // calculate total amount
      // const { getProductTotalPrice } = ProductToolKit
      // console.log(req.body.items)
      // return
      const { isInvalidFormat } = ParameterValidationKit
      const { items, stripeToken } = req.body

      // check whether token and items fields are filled?
      if (isInvalidFormat(stripeToken)) {
        return { error: new APIError({ code: code.FORBIDDEN, message: '目前付款資訊無法正常付款' }) }
      }

      if (isInvalidFormat(items)) {
        return { error: new APIError({ code: code.NOTFOUND, message: '找不到對應項目' }) }
      }

      // check whether syntax of items field is valid?
      const { quantityHashMapSyntaxValidate } = ProductToolKit
      const syntaxValidation = quantityHashMapSyntaxValidate(items)
      if (syntaxValidation.error) {
        const { result } = syntaxValidation
        return { error: new APIError({ code: result.code, message: result.message }) }
      }

      // check whether products are exist?
      const { existProductsValidate, getQuantityHashMap } = ProductToolKit
      const quantityHashMap = getQuantityHashMap(items)
      const keys = Object.keys(quantityHashMap)
      const existValidation = await existProductsValidate(keys, redisClient)
      if (existValidation.error) {
        const { result } = existValidation
        return { error: new APIError({ code: result.code, message: result.message }) }
      }

      // check whether stock is enough

      await redisLock.lock(DEFAULT_LOCKNAME, lockId)
      const { getStock, checkStockStatus } = ProductToolKit

      const stockHashMap = await getStock(keys, redisClient)
      const { soldOut, notEnough } = checkStockStatus(quantityHashMap, stockHashMap)
      const stockError = Boolean(soldOut.length) || Boolean(notEnough.length)

      if (stockError) {
        await redisLock.unlock(DEFAULT_LOCKNAME, lockId)
        return { error: new APIError({ code: code.BADREQUEST, data: { soldOut, notEnough }, message: '庫存問題' }) }
      }

      // if error
      const { purchaseTask } = PurchaseResource

      const chargeResult = await Promise.race([
        purchaseTask(req, quantityHashMap, stockHashMap),
        redisLock.refresh(DEFAULT_LOCKNAME, lockId)
      ])

      if (chargeResult instanceof Error) {
        await redisLock.unlock(DEFAULT_LOCKNAME, lockId)
        return { error: new APIError({ code: code.FORBIDDEN, message: '目前付款資訊無法正常付款' }) }
      }
      await redisLock.unlock(DEFAULT_LOCKNAME, lockId)

      const resultPurchase = null
      return { error: null, data: resultPurchase, message: '購買成功' }
    } catch (error) {
      await redisLock.unlock(DEFAULT_LOCKNAME, lockId)
      return { error: new APIError({ code: code.SERVERERROR, message: error.message }) }
    }
  }
}

exports = module.exports = {
  PurchaseResource
}
