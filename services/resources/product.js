
const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable
const { Product, Ownership, Stock, ProductStatistic } = require('../../db/models')

function syncDB(product) {
  let { expiredAt, dirtyBit } = product
  dirtyBit = Number(dirtyBit)
  const currentTime = (new Date()).valueOf()
  const expiredAtInms = (new Date('Fri Jun 01 2022 23:51:04 GMT+0800 (台北標準時間)')).valueOf()
  console.log(currentTime, expiredAtInms, expiredAt, typeof dirtyBit, dirtyBit)
  if (currentTime > expiredAtInms && dirtyBit) {
    product.quantity = 'hiii'
    // sync to DB based on Disk/SSD

    // initialize dirtyBit and expiredAt
  }
}

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
            model: Stock,
            attributes: ['quantity', 'restQuantity'],
            as: 'stock'
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
            model: Stock,
            attributes: ['quantity', 'restQuantity'],
            as: 'stock'
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

      let product = await redisClient.hgetall(`stock:${productId}`)
      let resultProduct = {}

      if (!Object.keys(product).length) {
        product = await Stock.findOne({ where: { productId } })
        if (!product) {
          return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
        }
        resultProduct = product.toJSON()
      } else {
        syncDB(product)
        // normalize to a product data
        delete product.dirtyBit
        delete product.expiredAt
        product.productId = productId
        product.createdAt = new Date(product.createdAt)
        product.updatedAt = new Date(product.updatedAt)
        resultProduct = product
      }

      return { error: null, data: resultProduct, message: '獲取成功' }
      // const product = await Stock.findByPk(productId)
      // if (!product) {
      //   return { error: new APIError({ code: code.NOTFOUND, status, message: '找不到對應項目' }) }
      // }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }
}

exports = module.exports = {
  ProductResource
}
