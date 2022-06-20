
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
    // initialize each session & cookie:
    // - refresh expiration date of cart cookie
    // - generate a config to tell redis how to set expiration of cart & cartItem in redis
    const createdAt = new Date()
    const key = `sess:${req.session.id}`
    const config = {
      key,
      expireAt: new Date(createdAt.getTime() + 7 * 86400 * 1000)
    }

    req.session.expireAtConfig = config
    req.session.cookie.path = '/carts'
    req.session.cookie.expires = config.expireAt

    // a cart owner which has a valid session
    if (req.session && req.session.cartId) {
      return next()
    }
    // a cart owner which does not has any session

    // build a new session
    // req.app.locals.redisStore.ttl = config.aliveDays * 86400
    const cartId = uuidv4()
    req.session.cartId = cartId
    req.session.firstSyncBit = false

    // build a anonymous cart instance to put some products:
    // - create a instance
    // - set expiration date to it

    const redisClient = req.app.locals.redisClient
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`

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

  // update cart data in DB and cache according to template(cart, cartItems)
  static async cartSync(req, cart, cartItems) {
    const { syncCacheTask, syncDBTask } = CartToolKit

    // update cart data in cache
    await Promise.all(
      cart.map(item => syncCacheTask(req, item, 'cart'))
    )
    await Promise.all(
      cartItems.map(item => syncCacheTask(req, item, 'cart_item'))
    )

    // update cart data in DB
    await Promise.all(
      cart.map(item => syncDBTask(item, 'cart'))
    )

    await Promise.all(
      cartItems.map(item => syncDBTask(item, 'cart_item'))
    )
  }

  // Sync cache and DB based on a logged Cart and a anonymous Cart
  // - fetch all cart data from the DB (a logged Cart) & Cache
  // - generate each template by merging data in DB & Cache and current session
  // - update the cart data in cache & DB according to the template

  static async mixedCartSync(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const itemKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`

    // fetch all cart data from the DB (a logged Cart) & Cache
    const { cartDB, cartItemDB } = await CartToolKit.getRecentCartDB(req)

    const cartCache = await redisClient.hgetall(cartKey)
    const cartItemCache = await RedisToolKit.getCacheValues(itemKeyPattern, redisClient)

    // generate each template by merging data in DB & Cache and current session
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

    // update the cart data in cache & DB according to the template
    await CartPreprocessor.cartSync(req, cart, cartItems)
  }

  // Sync cache and DB based on a logged Cart (belongs to current logged user)
  // - fetch all cart data from the DB (a logged Cart)
  // - generate each template by merging data in DB and current session
  // - update the cart data in cache & DB according to the template

  static async loggedCartSync(req) {
    // fetch all cart data from the DB (a logged Cart)
    const { cartDB, cartItemDB } = await CartToolKit.getRecentCartDB(req)

    // generate each template by merging data in DB and current session
    const cartMap = {}
    const cartItemMap = {}
    const cartOptions = { hashMap: cartMap, objects: cartDB, type: 'cart' }
    const cartItemOptions = { hashMap: cartItemMap, objects: cartItemDB, type: 'cart_item' }
    await CartToolKit.SyncHashMap(req, cartOptions)
    await CartToolKit.SyncHashMap(req, cartItemOptions)

    const cart = Object.values(cartMap).map(value => ({ ...value }))
    const cartItems = Object.values(cartItemMap).map(value => ({ ...value }))

    // update the cart data in cache & DB according to the template
    await CartPreprocessor.cartSync(req, cart, cartItems)
  }

  // Sync cache and DB based on a anonymous cart
  // - fetch all cart data from the cache (anonymous cart)
  // - generate each template by merging data in cache and current session
  // - update the cart data in cache & DB according to the template
  static async anonymousCartSync(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    const keyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`

    // fetch all cart data from the cache
    const cartCache = await redisClient.hgetall(cartKey)
    const cartItemCache = await RedisToolKit.getCacheValues(keyPattern, redisClient)

    //  generate each template by merging data in cache and current session
    const cartMap = {}
    const cartItemMap = {}
    const cartOptions = { hashMap: cartMap, objects: cartCache, type: 'cart' }
    const cartItemOptions = { hashMap: cartItemMap, objects: cartItemCache, type: 'cart_item' }
    await CartToolKit.SyncHashMap(req, cartOptions)
    await CartToolKit.SyncHashMap(req, cartItemOptions)

    const cart = Object.values(cartMap).map(value => ({ ...value }))
    const cartItems = Object.values(cartItemMap).map(value => ({ ...value }))

    //  update the cart data in cache & DB according to the template
    await CartPreprocessor.cartSync(req, cart, cartItems)
  }

  // a middleware is triggered when a user successfully logged first
  // - check whether there is anonymous cart in cache
  // - check whether there is a cart in DB which belongs to current logged user
  // - merge anonymous cart data and cart data in DB into the template according to above results
  // - update cart data in DB & cache according to the template

  static async loginSyncCart(req, _, next) {
    try {
      // check whether a user logins
      const user = AuthToolKit.getUser(req)
      const { firstSyncBit } = req.session

      // Vistor (a user without login)
      // do nothing for sync
      if (!user || firstSyncBit) return next()

      // Logged-In user who does not do the first sync task
      const { cartId } = req.session
      const redisClient = req.app.locals.redisClient
      const key = `${PREFIX_CART_KEY}:${cartId}`

      // - check whether there is anonymous cart in cache
      // - check whether there is a cart in DB which belongs to logged user
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
          await CartPreprocessor.loggedCartSync(req)
          break

        case (isExistInCache && !isExistInDB):
          // case 3: Except for DB, there is a cart data on cache
          await CartPreprocessor.anonymousCartSync(req)
          break
        case (isExistInCache && isExistInDB):
          // case 4: There is a cart data on cache and DB
          await CartPreprocessor.mixedCartSync(req)
          break
      }
      // just finish first sync task, then set true for avoiding doing this again
      req.session.firstSyncBit = true
      return next()
    } catch (error) {
      return next(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // a middleware:
  // - sync expire date to cart which belongs to current session
  // - sync expire date to each cartItem which belongs to current session
  static async syncExpireAt(req, _, next) {
    try {
      const redisClient = req.app.locals.redisClient
      const { cartId } = req.session
      const { expireAt } = req.session.expireAtConfig

      const cartItemKeyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
      const cartKey = `${PREFIX_CART_KEY}:${cartId}`

      let cursor = '0'
      let cartItemKeys = []
      const { setExpireAt } = RedisToolKit

      // sync cart
      await setExpireAt(cartKey, expireAt, redisClient)

      // sync cartItems
      while (true) {
        [cursor, cartItemKeys] = await redisClient.scan(cursor, 'MATCH', cartItemKeyPattern)
        await Promise.all(
          cartItemKeys.map(key => setExpireAt(key, expireAt, redisClient))
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
