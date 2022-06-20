
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { Product, Ownership, Stock, ProductStatistic } = require('../../db/models')
const { ParameterValidationKit } = require('../../utils/parameter-validation-kit')

class ProductResource {
  static async getProducts(req, type = 'get') {
    try {
      const { page, limit, offset, order } = req.query

      const findOption = {
        include: [
          {
            model: Ownership,
            attributes: ['categoryId', 'categoryName'],
            as: 'productCategory'
          },
          {
            model: ProductStatistic,
            attributes: ['likedTally', 'repliedTally'],
            as: 'statistics'
          }
        ],
        order: [['createdAt', order]],
        nest: true
      }

      switch (type) {
        case 'get':
          findOption.limit = limit
          findOption.offset = offset
          break
        case 'search':
          // do something for searching
          break
      }

      const products = await Product.findAll(findOption)

      if (!products.length) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }) }
      }
      const resultProducts = products.map(product => product.toJSON())
      return { error: null, data: { currentPage: page, resultProducts }, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async getProductSnapshot(req) {
    try {
      // check whether the product exist
      const redisClient = req.app.locals.redisClient
      const { productId } = req.params
      const snapshotKey = `product:${productId}`

      let snapshot = await redisClient.hgetall(snapshotKey)
      const existStockCache = Boolean(Object.keys(snapshot).length)
      // if none

      if (!existStockCache) {
        const findOption = { raw: true, attributes: ['name', 'image'] }
        snapshot = await Product.findByPk(productId, findOption)
        if (!snapshot) {
          return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
        }
      }
      // if yes
      // return success message
      const resultSnapshot = snapshot
      return { error: null, data: resultSnapshot, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async getProduct(req) {
    try {
      const { productId } = req.params
      const findOption = {
        include: [
          {
            model: Ownership,
            attributes: ['categoryId', 'categoryName'],
            as: 'productCategory'
          },
          {
            model: ProductStatistic,
            attributes: ['likedTally', 'repliedTally'],
            as: 'statistics'
          }
        ],
        nest: true
      }
      const product = await Product.findByPk(productId, findOption)

      if (!product) {
        return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      }
      const resultProduct = product.toJSON()
      return { error: null, data: resultProduct, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async getStock(req) {
    try {
      const { productId } = req.params
      const { redisClient } = req.app.locals
      const stocktKey = `stock:${productId}`
      let product = await redisClient.hgetall(stocktKey)
      let resultProduct = {}

      if (!Object.keys(product).length) {
        const findOption = {
          where: { productId },
          attributes: { exclude: ['id'] }
        }
        product = await Stock.findOne(findOption)
        if (!product) {
          return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
        }
        resultProduct = product.toJSON()
      } else {
        const option = {
          taskType: 'update',
          findOption: { where: { productId } }
        }
        await RedisToolKit.syncDBFromCache(stocktKey, redisClient, option)
        // normalize to a product data

        resultProduct = {
          productId: Number(product.productId),
          quantity: Number(product.quantity),
          restQuantity: Number(product.restQuantity),
          price: Number(product.price),
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        }
      }

      return { error: null, data: resultProduct, message: '獲取成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async putStock(req) {
    try {
      // check whether parameters are valid

      const message = ParameterValidationKit.updateStockValidate(req)

      if (message.length) {
        return { error: new APIError({ code: code.BADREQUEST, status, message, data: req.body }) }
      }

      // check whether product exists
      // ready to update stock for the product:
      // - update stock to cache
      // - update stock to DB and build a stock data into cache (if failed for updating cache)
      // check dirtyBit and expiredAt
      const { productId } = req.params
      const { redisClient } = req.app.locals
      const { quantity, restQuantity, price } = req.body
      const stocktKey = `stock:${productId}`

      const product = await redisClient.hgetall(stocktKey)
      let resultProduct = {}
      const isExistProductInCache = Boolean(Object.keys(product).length)

      if (!isExistProductInCache) {
        const stockProduct = await Stock.findOne({ where: { productId } })
        if (!stockProduct) {
          return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
        }
        await stockProduct.update({ quantity, restQuantity, price })
      }

      // update stock to cache
      const { getRefreshAt } = RedisToolKit
      const template = {
        productId,
        quantity,
        restQuantity,
        price,
        createdAt: isExistProductInCache ? new Date(product.createdAt) : new Date(),
        updatedAt: new Date(),
        dirtyBit: isExistProductInCache ? 1 : 0,
        refreshAt: isExistProductInCache ? product.refreshAt : getRefreshAt(stocktKey, new Date())
      }

      await redisClient.hset(stocktKey, template)

      // sync db according to refreshAt and dirtyBit
      if (isExistProductInCache) {
        const option = {
          taskType: 'update',
          findOption: { where: { productId } }
        }
        await RedisToolKit.syncDBFromCache(stocktKey, redisClient, option)
      }
      // normalize a product data
      resultProduct = {
        productId: Number(productId),
        quantity,
        restQuantity,
        price,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }

      return { error: null, data: resultProduct, message: '修改成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ProductResource
}
