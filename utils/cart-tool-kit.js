const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { Cart, CartItem } = require('../db/models')
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../config/app').cache.CART
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { AuthToolKit } = require('../utils/auth-tool-kit')
const { ProductToolKit } = require('../utils/product-tool-kit')
const { ParameterValidationKit } = require('./parameter-validation-kit')
const { code } = require('../config/result-status-table').errorTable

class CartToolKit {
  static async existCartCache(cart, key = null, cache = null) {
    let resultCart = cart
    if (cache) resultCart = await cache.hgetall(key)
    return Boolean(Object.keys(resultCart).length) && resultCart.sum !== '0'
  }

  static async existCartDB(cart, findOption = null) {
    let resultCart = cart
    if (findOption) resultCart = await Cart.findOne(findOption)
    return Boolean(resultCart) && resultCart.sum !== 0
  }

  static existCartProduct(product) {
    const keys = Object.keys(product)
    // the product is not in the cart
    if (!keys.length || product.quantity === '0') return false
    // the product is in the cart
    return true
  }

  static cartItemSyntaxValidate(req) {
    const { productId } = req.body
    const { isInvalidFormat, canBeANumber } = ParameterValidationKit
    let result = {}

    if (isInvalidFormat(productId) || !canBeANumber(productId)) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應項目' }
      return { error: true, result }
    }

    return { error: false, result }
  }

  static isEmptyCart(cart) {
    if (!cart.length) return true
    return cart.every(product => product.quantity === '0')
  }

  static getValidProducts(cart) {
    const resultProducts = cart.filter(product => Number(product.quantity) > 0)
    return resultProducts
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

  static async SyncCartHashMap(req, cartMap, cart) {
    const currentId = req.session.cartId
    const userId = AuthToolKit.getUserId(req)
    const { id } = cart
    const key = `${PREFIX_CART_KEY}:${currentId}`
    if (!cartMap[userId]) {
      cartMap[userId] = {
        id: currentId,
        userId,
        sum: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        dirtyBit: 0,
        refreshAt: await RedisToolKit.getRefreshAt(key, new Date()),
        oldId: cart instanceof Cart ? id : null
      }
    }
    cartMap[userId].sum += Number(cart.sum)
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
          sequelize: item instanceof CartItem ? item : null
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

  static async getCartsByProduct(req, productId) {
    const redisClient = req.app.locals.redisClient
    const cartItemKeyPattern = `${PREFIX_CARTITEM_KEY}:*:${productId}`

    const results = []
    let cursor = '0'
    let result = []
    while (true) {
      [cursor, result] = await redisClient.scan(cursor, 'MATCH', cartItemKeyPattern, 'COUNT', 20)
      result = result.map(item => item.split(':')[1])
      results.push(...result)
      if (cursor === '0') break
    }
    return results
  }

  // a task template for synchronizing cache:
  // - generate a template for sync cache
  // - sync cache with the template
  // - sync cartId in DB with product object
  static async syncCacheTask(req, object, type) {
    const redisClient = req.app.locals.redisClient
    const { expireAt } = req.session.expireAtConfig
    // current session
    const { cartId } = req.session
    const { productId } = object
    let key = ''
    let template = {}
    switch (type) {
      case 'cart':
        key = `${PREFIX_CART_KEY}:${cartId}`
        template = getCartTemplate(object)
        break
      case 'cart_item':
        key = `${PREFIX_CARTITEM_KEY}:${cartId}:${productId}`
        template = getCartItemTemplate(object)
        break
    }

    await redisClient.hset(key, template)
    await RedisToolKit.setExpireAt(key, expireAt, redisClient)

    function getCartTemplate(object) {
      const template = { ...object }
      delete template.oldId
      return template
    }

    function getCartItemTemplate(object) {
      const template = { ...object }
      delete template.oldCartId
      delete template.sequelize
      return template
    }
  }

  // a task template for synchronizing db
  static async syncDBTask(object, targetDB) {
    let template = {}
    let findOption = {}

    switch (targetDB) {
      case 'cart': {
        template = getCartTemplate(object)
        findOption = {
          where: {
            id: object.oldId || object.id
          },
          defaults: template
        }
        break
      }
      case 'cart_item': {
        template = getCartItemTemplate(object)
        findOption = {
          where: {
            cartId: object.oldCartId || object.cartId,
            productId: template.productId
          },
          defaults: template
        }

        break
      }
    }

    const record = object.sequelize
    if (targetDB === 'cart') {
      const [_, created] = await Cart.findOrCreate(findOption)
      if (!created) await Cart.update(template, findOption)
    } else if (record) {
      record.update(template)
    } else {
      await RedisToolKit.updateDBTask(targetDB, template, findOption)
    }

    function getCartTemplate(object) {
      const template = {
        id: object.id,
        userId: object.userId,
        sum: object.sum,
        createdAt: object.createdAt,
        updatedAt: object.updatedAt
      }
      return template
    }

    function getCartItemTemplate(object) {
      const template = {
        cartId: object.cartId,
        productId: object.productId,
        price: object.price,
        quantity: object.quantity,
        createdAt: object.createdAt,
        updatedAt: object.updatedAt
      }
      return template
    }
  }

  static async postCartItemsValidate(req) {
    const { productId } = req.body
    const redisClient = req.app.locals.redisClient
    const productKey = `product:${productId}`
    // check whether parameter syntax is correct
    let result = {}
    // const { error, result } = CartToolKit.cartItemSyntaxValidate(req)
    const syntaxValidation = CartToolKit.cartItemSyntaxValidate(req)
    if (syntaxValidation.error) {
      const { result } = syntaxValidation
      return { error: true, result }
    }
    // check whether product exists in product
    const product = await redisClient.hgetall(productKey)
    // nothing
    if (!Object.keys(product).length) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應項目' }
      return { error: true, result }
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
      result = { code: code.BADREQUEST, data: { soldOut, notEnough }, message: '庫存問題' }
      return { error: true, result }
    }

    result = { cartHashMap, stockHashMap, cartItem }
    return { error: false, result }
  }

  static async putCartItemsValidate(req) {
    const { isUndefined } = ParameterValidationKit
    const redisClient = req.app.locals.redisClient
    const { cartId } = req.session
    const { items } = req.body
    const defaultData = isUndefined(items) ? null : JSON.stringify(items)
    const cart = items

    let result = {}
    const syntaxValidation = ProductToolKit.quantityHashMapSyntaxValidate(cart)

    if (syntaxValidation.error) {
      const { result } = syntaxValidation
      return { error: true, result }
    }

    const cartHashMap = ProductToolKit.getQuantityHashMap(cart)

    const entries = Object.entries(cartHashMap)
    const keys = entries.map(([key, _]) => key)

    async function ExistenceTest(keys, cache) {
      for (const key of keys) {
        const result = await cache.hgetall(key)
        if (result.quantity === '0') return false
        if (!Object.keys(result).length) return false
      }
      return true
    }

    // check whether one of products is not inside the cart
    const cartKeys = keys.map(item => `${PREFIX_CARTITEM_KEY}:${cartId}:${item}`)
    const areValidProducts = await ExistenceTest(cartKeys, redisClient)

    if (!areValidProducts) {
      result = { code: code.NOTFOUND, data: defaultData, message: '購物車內找不到對應項目' }
      return { error: true, result }
    }

    //  check whether stock is enough?
    const { getStock, checkStockStatus } = ProductToolKit
    const stockHashMap = await getStock(keys, redisClient)
    const { soldOut, notEnough } = checkStockStatus(cartHashMap, stockHashMap)
    const stockError = Boolean(soldOut.length) || Boolean(notEnough.length)

    if (stockError) {
      result = { code: code.BADREQUEST, data: { soldOut, notEnough }, message: '庫存問題' }
      return { error: true, result }
    }

    result = { cartHashMap, stockHashMap }
    return { error: false, result }
  }
}

exports = module.exports = {
  CartToolKit
}
