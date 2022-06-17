const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { Cart, CartItem } = require('../db/models')
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../config/app').cache.CART
const { RedisToolKit } = require('../utils/redis-tool-kit')

class CartToolKit {
  static async isExistCartCache(cart, key = null, cache = null) {
    let resultCart = cart
    if (cache) resultCart = await cache.hgetall(key)
    return Boolean(Object.keys(resultCart).length) && resultCart.sum !== '0'
  }

  static async isExistCartDB(cart, pk = null) {
    let resultCart = cart
    if (pk) resultCart = await Cart.findByPk(pk)
    return Boolean(resultCart) && resultCart.sum !== 0
  }

  // a task template for synchronizing cache
  static async syncCacheTask(req, product, cache) {
    const { expireAt } = req.session.expireAtConfig
    const { cartId, productId } = product
    const key = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
    const refreshAt = await RedisToolKit.getRefreshAt(key, new Date())

    const template = {
      ...product,
      dirtyBit: 0,
      refreshAt: refreshAt
    }

    if (template.id) delete template.id
    await cache.hset(key, template)
    await RedisToolKit.setExpireAt(key, expireAt, cache)
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
        const { cartId, productId } = product
        findOption = {
          where: { cartId, productId },
          defaults: template
        }
        break
      }
      case 'cart': {
        const { id } = product
        console.log(product, id)
        findOption = {
          where: { id },
          defaults: template
        }
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
