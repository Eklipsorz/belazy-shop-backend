
const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { CartItem, Cart } = require('../db/models')
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { CartToolKit } = require('../utils/cart-tool-kit')
const { AuthToolKit } = require('../utils/auth-tool-kit')
const { v4: uuidv4 } = require('uuid')
const { PREFIX_CART_KEY, PREFIX_CARTITEM_KEY } = require('../config/app').cache.CART

class CartPreprocessor {
  static async getSession(req, _, next) {
    const createdAt = new Date()
    const key = `sess:${req.session.id}`
    const config = {
      key,
      expireAt: new Date(createdAt.getTime() + 7 * 86400 * 1000)
    }
    req.session.expireAtConfig = config
    req.session.cookie.path = '/carts'
    req.session.cookie.expires = config.expireAt

    if (req.session && req.session.cartId) {
      return next()
    }
    // build a new session
    // req.app.locals.redisStore.ttl = config.aliveDays * 86400
    const redisClient = req.app.locals.redisClient
    const cartId = uuidv4()
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    req.session.cartId = cartId
    req.session.firstSyncBit = false

    const template = {
      id: cartId,
      userId: '',
      sum: '0',
      createdAt: '',
      updatedAt: ''
    }

    await redisClient.hset(cartKey, template)
    await RedisToolKit.setExpireAt(cartKey, config.expireAt, redisClient)

    return next()
  }

  // sync db and cache
  static async syncCartToDBAndCache(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const itemKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    const { cartDB, cartItemDB } = await CartToolKit.getRecentCartDB(req)

    // get all cart from cache and db
    const cartCache = await redisClient.hgetall(cartKey)
    const cartItemCache = await RedisToolKit.getCacheValues(itemKeyPattern, redisClient)

    const cartMap = {}
    const cartItemMap = {}
    const cartDBOptions = { hashMap: cartMap, objects: cartDB, type: 'cart' }
    const cartItemDBOptions = { hashMap: cartItemMap, objects: cartItemDB, type: 'cart_item' }
    await CartToolKit.SyncHashMap(req, cartDBOptions)
    await CartToolKit.SyncHashMap(req, cartItemDBOptions)

    const cartCacheOptions = { hashMap: cartMap, objects: cartCache, type: 'cart' }
    const cartItemCacheOptions = { hashMap: cartItemMap, objects: cartItemCache, type: 'cart_item' }
    await CartToolKit.SyncHashMap(req, cartCacheOptions)
    await CartToolKit.SyncHashMap(req, cartItemCacheOptions)

    const cart = Object.values(cartMap).map(value => ({ ...value }))
    const cartItems = Object.values(cartItemMap).map(value => ({ ...value }))

    const { syncCacheTask, syncDBTask } = CartToolKit

    await Promise.all(
      cart.map(item => syncCacheTask(req, item, 'cart'))
    )
    await Promise.all(
      cartItems.map(item => syncCacheTask(req, item, 'cart_item'))
    )

    await Promise.all(
      cart.map(item => syncDBTask(item, 'cart'))
    )

    await Promise.all(
      cartItems.map(item => syncDBTask(item, 'cart_item'))
    )
    // merge cart data in cache and in db into a set of cart data
    // productHash[cartId] = cartObject
  }

  // sync cache with data in db
  static async syncCartFromDBtoCache(req) {
    const { cartDB, cartItemDB } = await CartToolKit.getRecentCartDB(req)

    const cartMap = {}
    const cartItemMap = {}
    const cartOptions = { hashMap: cartMap, objects: cartDB, type: 'cart' }
    const cartItemOptions = { hashMap: cartItemMap, objects: cartItemDB, type: 'cart_item' }
    await CartToolKit.SyncHashMap(req, cartOptions)
    await CartToolKit.SyncHashMap(req, cartItemOptions)

    const cart = Object.values(cartMap).map(value => ({ ...value }))
    const cartItems = Object.values(cartItemMap).map(value => ({ ...value }))

    // generate a set of tasks to sync with data inside db
    const { syncCacheTask, syncDBTask } = CartToolKit

    await Promise.all(
      cart.map(item => syncCacheTask(req, item, 'cart'))
    )
    await Promise.all(
      cartItems.map(item => syncCacheTask(req, item, 'cart_item'))
    )

    await Promise.all(
      cart.map(item => syncDBTask(item, 'cart'))
    )

    await Promise.all(
      cartItems.map(item => syncDBTask(item, 'cart_item'))
    )
  }

  static async syncCartFromCachetoDB(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    const keyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`

    // sync from cache to DB
    const cartCache = await redisClient.hgetall(cartKey)
    // get all items with current cartId
    const cartItemCache = await RedisToolKit.getCacheValues(keyPattern, redisClient)

    const cartMap = {}
    const cartItemMap = {}
    const cartOptions = { hashMap: cartMap, objects: cartCache, type: 'cart' }
    const cartItemOptions = { hashMap: cartItemMap, objects: cartItemCache, type: 'cart_item' }
    await CartToolKit.SyncHashMap(req, cartOptions)
    await CartToolKit.SyncHashMap(req, cartItemOptions)

    const cart = Object.values(cartMap).map(value => ({ ...value }))
    const cartItems = Object.values(cartItemMap).map(value => ({ ...value }))

    const { syncCacheTask, syncDBTask } = CartToolKit

    // update userId in cache
    await Promise.all(
      cart.map(item => syncCacheTask(req, item, 'cart'))
    )

    await Promise.all(
      cartItems.map(item => syncCacheTask(req, item, 'cart_item'))
    )

    await Promise.all(
      cart.map(item => syncDBTask(item, 'cart'))
    )

    await Promise.all(
      cartItems.map(item => syncDBTask(item, 'cart_item'))
    )
  }

  static async loginSyncCart(req, _, next) {
    // check whether a user logins
    const user = req?.user
    const { firstSyncBit } = req.session

    // Vistor (a user without login)
    // do nothing for sync

    if (!user || firstSyncBit) return next()
    // Logged-In User
    try {
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const key = `${PREFIX_CART_KEY}:${cartId}`
      // get cart data from cache and db

      const [cartInCache, cartInDB] = await Promise.all([
        redisClient.hgetall(key),
        Cart.findOne({ where: { userId: user.id } })
      ])

      // true -> there exists cart data in cache or db
      // false -> there is nothing data in cache or db
      const isExistInCache = await CartToolKit.isExistCartCache(cartInCache)
      const isExistInDB = await CartToolKit.isExistCartDB(cartInDB)

      // case 1: There is nothing on cache and DB
      // do nothing

      switch (true) {
        case (!isExistInCache && !isExistInDB):
          // case 1: There is nothing on cache and DB
          // do nothing
          break

        case (!isExistInCache && isExistInDB):
          // case 2: Except for cache, there is a cart data on DB
          await CartPreprocessor.syncCartFromDBtoCache(req)
          break

        case (isExistInCache && !isExistInDB):
          // case 3: Except for DB, there is a cart data on cache
          await CartPreprocessor.syncCartFromCachetoDB(req)
          break
        case (isExistInCache && isExistInDB):
          // case 4: There is a cart data on cache and DB
          await CartPreprocessor.syncCartToDBAndCache(req)
          break
      }

      req.session.firstSyncBit = true
      return next()
    } catch (error) {
      return next(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  static async syncExpireAt(req, _, next) {
    try {
      const redisClient = req.app.locals.redisClient
      const { cartId } = req.session
      const { expireAt } = req.session.expireAtConfig
      const keyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`

      let cursor = '0'
      let keys = []

      async function syncExpireAtTask(key, expireAt, cache) {
        await RedisToolKit.setExpireAt(key, expireAt, cache)
      }

      while (true) {
        [cursor, keys] = await redisClient.scan(cursor, 'MATCH', keyPattern)
        await Promise.all(
          keys.map(key => syncExpireAtTask(key, expireAt, redisClient))
        )

        if (cursor === '0') break
      }
      return next()
    } catch (error) {
      return next(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }
}

exports = module.exports = {
  CartPreprocessor
}
