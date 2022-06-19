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

  // static mergeTask(product, hashMap) {
  //   const id = product.productId
  //   const productData = product instanceof CartItem ? product.toJSON() : product
  //   if (!hashMap[id]) {
  //     hashMap[id] = {
  //       ...productData,
  //       cartId,
  //       oldCartId: product instanceof CartItem ? product.cartId : null,
  //       quantity: 0,
  //       price: 0
  //     }
  //   }

  //   if (product instanceof CartItem) hashMap[id].sequelize = product
  //   hashMap[id].quantity += Number(product.quantity)
  //   hashMap[id].price += Number(product.price)
  // }

  static async SyncCartHashMap(req, cartMap, cart) {
    const currentId = req.session.cartId
    const { id } = cart
    const key = `${PREFIX_CART_KEY}:${currentId}`
    if (!cartMap[id]) {
      cartMap[id] = {
        id: currentId,
        userId: AuthToolKit.getUserId(req),
        sum: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        dirtyBit: 0,
        refreshAt: await RedisToolKit.getRefreshAt(key, new Date()),
        oldId: cart instanceof Cart ? id : null
      }
    }
    cartMap[id].sum += Number(cart.sum)
  }

  static async SyncCartItemHashMap(req, cartItemMap, items) {
    for (const item of items) {
      const currentCartId = req.session.cartId
      const { productId } = item

      if (!cartItemMap[productId]) {
        cartItemMap[productId] = {
          cartId: currentCartId,
          productId,
          price: 0,
          quantity: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          dirtyBit: 0,
          oldCartId: item instanceof CartItem ? item.cartId : null,
          sequelize: item
        }
      }
      cartItemMap[productId].price += Number(item.price)
      cartItemMap[productId].quantity += Number(item.quantity)
    }
  }

  static async SyncHashMap(req, { hashMap, objects, type }) {
    const { SyncCartHashMap, SyncCartItemHashMap } = CartToolKit
    switch (type) {
      case 'cart':
        return await SyncCartHashMap(req, hashMap, objects)
      case 'cart_item':
        return await SyncCartItemHashMap(req, hashMap, objects)
    }
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
