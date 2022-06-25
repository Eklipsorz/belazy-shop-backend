
const { APIError } = require('../../helpers/api-error')
const { RedisToolKit } = require('../../utils/redis-tool-kit')
const { Product, Ownership, Stock, ProductStatistic } = require('../../db/models')
const { ProductToolKit } = require('../../utils/product-tool-kit')
const { FileUploader } = require('../../middlewares/file-uploader')
const { status, code } = require('../../config/result-status-table').errorTable
const { DEFAULT_PRODUCT_IMAGE, DEL_OPERATION_CODE } = require('../../config/app').service.productResource

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

  static async postProducts(req) {
    try {
      // check whether the parameters are valid
      // - one of all fields (name, categoryId) is empty ?
      // - length of product name is longer than 30 characters ?
      // - categoryId can be mapped to valid category ?
      // - product name is repeated ?
      const { error, result } = await ProductToolKit.postProductsValidate(req)
      if (error) {
        return { error: new APIError({ code: result.code, data: result.data, message: result.message }) }
      }

      // All is okay, then just create a new product record into DB
      const { name, introduction } = req.body
      const { categories } = result.data
      const image = req.file ? await FileUploader.upload(req.file) : DEFAULT_PRODUCT_IMAGE
      const redisClient = req.app.locals.redisClient

      // inital value for stock and statistics
      const price = 0
      const quantity = 0
      const restQuantity = 0
      const likedTally = 0
      const repliedTally = 0

      // begin to create
      const product = await Product.create({ name, introduction, image })
      const productId = product.id

      // create a new product into ownerships
      for (const category of categories) {
        await Ownership.create({ productId, categoryId: category.id, categoryName: category.name })
      }
      // create a new product into stock with initial value
      // create a new product into product_statistics
      const [stock, _] = await Promise.all([
        Stock.create({ productId, quantity, restQuantity, price }),
        ProductStatistic.create({ productId, likedTally, repliedTally })
      ])

      // create a new product into redis
      // create a new product into snapshot
      // create a new product into stock
      // key pattern for redis
      const snapshotKey = `product:${productId}`
      const stockKey = `stock:${productId}`

      const snapshotTemplate = { name, image }
      const stockTemplate = {
        ...stock.toJSON(),
        dirtyBit: 0,
        refreshAt: await RedisToolKit.getRefreshAt(stockKey, new Date())
      }

      if (stockTemplate.id) delete stockTemplate.id

      await Promise.all([
        redisClient.hset(snapshotKey, snapshotTemplate),
        redisClient.hset(stockKey, stockTemplate)
      ])

      const resultProduct = null
      return { error: null, data: resultProduct, message: '添加成功' }
    } catch (error) {
      return { error: new APIError({ code: code.SERVERERROR, status, message: error.message }) }
    }
  }

  static async putProducts(req) {
    try {
      // check whether the product exists?
      // check whether the parameters are valid
      // - one of all fields (name, categoryId) is empty ?
      // - length of product name is longer than 30 characters ?
      // - categoryId can be mapped to valid category ?
      // - product name is repeated ?

      const { error, result } = await ProductToolKit.putProductsValidate(req)
      if (error) {
        return { error: new APIError({ code: result.code, data: result.data, message: result.message }) }
      }

      let { image } = req.body
      const { productId } = req.params
      const { name, introduction } = req.body
      const redisClient = req.app.locals.redisClient

      if (image === DEL_OPERATION_CODE) {
        image = DEFAULT_PRODUCT_IMAGE
      } else {
        image = req.file ? await FileUploader.upload(req.file) : DEFAULT_PRODUCT_IMAGE
      }

      // just update productSnapshot in Redis
      const snapshotKey = `product:${productId}`
      const snapshotTemplate = { name, image }
      await redisClient.hset(snapshotKey, snapshotTemplate)

      // update the record in Ownerships
      const { categories } = result.data
      await Ownership.destroy({ where: { productId } })

      for (const category of categories) {
        await Ownership.create({ productId, categoryId: category.id, categoryName: category.name })
      }
      // update the record in Products
      const { product } = result.data
      await product.update({ name, introduction, image })

      const resultProduct = null
      return { error: null, data: resultProduct, message: '修改成功' }
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
      // check whether product exists
      // check whether parameters are validation
      const { error, result } = await ProductToolKit.updateStockValidate(req)
      if (error) {
        return { error: new APIError({ code: result.code, data: result.data, message: result.message }) }
      }
      // ready to update stock for the product:
      // - update stock to cache
      // - update stock to DB and build a stock data into cache (if failed for updating cache)
      // check dirtyBit and expiredAt
      const { productId } = req.params
      const { redisClient } = req.app.locals
      const { quantity, restQuantity, price } = req.body
      const stocktKey = `stock:${productId}`
      const product = result.data

      // update stock to cache
      const template = {
        productId,
        quantity,
        restQuantity,
        price,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(),
        dirtyBit: 1,
        refreshAt: new Date(product.refreshAt)
      }

      await redisClient.hset(stocktKey, template)

      // sync db according to refreshAt and dirtyBit
      if (product) {
        const option = {
          taskType: 'update',
          findOption: { where: { productId } }
        }
        await RedisToolKit.syncDBFromCache(stocktKey, redisClient, option)
      }

      // normalize a product data
      const resultProduct = {
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
