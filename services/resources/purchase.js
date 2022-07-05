const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

const stripe = require('stripe')(process.env.STRIPE_BACKEND_APIKEY)
const { APIError } = require('../../helpers/api-error')
const { code } = require('../../config/result-status-table').errorTable
const { ProductToolKit } = require('../../utils/product-tool-kit')

class PurchaseResource {
  static async postPurchase(req) {
    try {
      // calculate total amount
      const { getProductTotalPrice } = ProductToolKit
      const { items, stripeTokenId } = req.body
      let amount = 0

      for (const item of items) {
        const { id, quantity } = item
        const productTotal = await getProductTotalPrice(req, id, quantity)
        amount += productTotal
      }
      console.log('total amount', amount)
      // charge
      const result = await stripe.charges.create({
        amount,
        source: stripeTokenId,
        currency: 'usd'
      })
      // if error
      if (result instanceof Error) {
        return { error: new APIError({ code: code.FORBIDDEN, message: '目前付款資訊無法正常付款' }) }
      }
      const resultPurchase = null
      return { error: null, data: resultPurchase, message: '購買成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, message: error.message }) }
    }
  }
}

exports = module.exports = {
  PurchaseResource
}
