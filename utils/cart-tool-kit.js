const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { Cart, CartItem } = require('../db/models')
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../config/app').cache.CART
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { AuthToolKit } = require('../utils/auth-tool-kit')

class CartToolKit {
  static async isExistCartCache(cart, key = null, cache = null) {
    let resultCart = cart
    if (cache) resultCart = await cache.hgetall(key)
    return Boolean(Object.keys(resultCart).length) && resultCart.sum !== '0'
  }

  static async isExistCartDB(cart, findOption = null) {
    let resultCart = cart
    if (findOption) resultCart = await Cart.findOne(findOption)
    return Boolean(resultCart) && resultCart.sum !== 0
  }

  static async getRecentCartDB(req) {
    const userId = AuthToolKit.getUserId(req)

    const findCartOption = {
      where: { userId },
      order: [['createdAt', 'DESC']]
    }
    const cartDB = await Cart.findOne(findCartOption)

    const findItemsOption = {
      where: { cartId: cartDB.id }
    }
    const cartItemDB = await CartItem.findAll(findItemsOption)

    const result = { cartDB, cartItemDB }
    return result
  }

  // a task template for synchronizing cache:
  // - generate a template for sync cache
  // - sync cache with the template
  // - sync cartId in DB with product object
  static async syncCacheTask(req, product, type) {
    const redisClient = req.app.locals.redisClient
    const { expireAt } = req.session.expireAtConfig
    // current session
    const { cartId } = req.session
    const { productId } = product

    let key = ''
    let productData = {}
    let productObject = {}
    let template = {}

    const refreshAt = await RedisToolKit.getRefreshAt(key, new Date())

    switch (type) {
      case 'cart_item': {
        key = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
        productData = product instanceof CartItem ? product.toJSON() : product
        productObject = product instanceof CartItem ? product : product.sequelize
        template = {
          ...productData,
          cartId,
          dirtyBit: 0,
          refreshAt: refreshAt
        }
        // update data in db with new CartId
        await productObject.update({ cartId })
        break
      }
      case 'cart': {
        key = `${PREFIX_CART_KEY}:${cartId}`
        productData = product instanceof Cart ? product.toJSON() : product
        productObject = product

        template = {
          ...productData,
          id: cartId,
          dirtyBit: 0,
          refreshAt: refreshAt
        }
        // update data in db with new CartId
        console.log('old ', productData.id)
        await Cart.update({ id: cartId }, { where: { id: productData.id } })
        break
      }
    }

    // sync cartItem in db to cache with new CartId
    // if (template.oldId) delete template.oldId
    // if (template.oldCartId) delete template.oldCartId
    if (template.sequelize) delete template.sequelize
    if (template.id) delete template.id

    await redisClient.hset(key, template)
    await RedisToolKit.setExpireAt(key, expireAt, redisClient)
  }

  // a task template for synchronizing db
  static async syncDBTask(product, targetDB) {
    const template = {
      ...await RedisToolKit.correctDataType(product)
    }
    if (template.dirtyBit) delete template.dirtyBit
    if (template.refreshAt) delete template.refreshAt

    let findOption = {}

    switch (targetDB) {
      case 'cart_item': {
        const { cartId, oldCartId, productId } = product

        findOption = {
          where: {
            cartId: oldCartId || cartId,
            productId
          },
          defaults: template
        }
        console.log('cartItem syncDBTask', cartId, oldCartId, findOption)
        break
      }
      case 'cart': {
        const { id, oldId } = product
        findOption = {
          where: {
            id: oldId || id
          },
          defaults: template
        }
        console.log('cart syncDBTask', id, oldId, findOption)
        break
      }
    }

    // create a record if there is nothing about cartId and productId
    // update the record if there is a cart data with cartId and productId
    await RedisToolKit.updateDBTask(targetDB, template, findOption)
  }
}

exports = module.exports = {
  CartToolKit
}
