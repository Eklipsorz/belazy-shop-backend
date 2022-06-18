
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

    const keyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`
    const findOption = {
      where: { cartId },
      raw: true
    }
    // get all cart from cache and db
    const cacheResult = await RedisToolKit.getCacheValues(keyPattern, redisClient)
    const dbResult = await CartItem.findAll(findOption)

    // merge cart data in cache and in db into a set of cart data
    // productHash[cartId] = cartObject
    const productHash = {}
    function mergeTask(product) {
      const id = product.productId
      if (!productHash[id]) {
        productHash[id] = {
          ...product,
          quantity: 0,
          price: 0
        }
      }
      productHash[id].quantity += Number(product.quantity)
      productHash[id].price += Number(product.price)
    }

    cacheResult.forEach(mergeTask)
    dbResult.forEach(mergeTask)

    // productHash -> { cartObject1, cartObject2, ....}
    const resultProduct = Object.values(productHash).map(value => ({ ...value }))

    const syncDBTask = CartToolKit.syncDBTask
    // generate a set of tasks to sync db
    await Promise.all(
      resultProduct.map(syncDBTask)
    )

    const syncCacheTask = CartToolKit.syncCacheTask

    // generate a set of tasks to sync cache
    await Promise.all(
      resultProduct.map(product => syncCacheTask(req, product, redisClient))
    )
  }

  // sync cache with data in db
  static async syncCartFromDBtoCache(req) {
    const userId = AuthToolKit.getUserId(req)
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const findCartOption = {
      where: { userId },
      order: [['createdAt', 'DESC']],
      raw: true
    }

    const cart = await Cart.findOne(findCartOption)
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    const oldCartId = cart.id

    // sync data in db to cache with new CartId
    const template = {
      ...cart,
      id: cartId,
      dirtyBit: 0,
      refreshAt: RedisToolKit.getRefreshAt(cartKey, new Date())
    }
    await redisClient.hset(cartKey, template)

    // find data in db with oldCartId
    const findItemOption = {
      where: { cartId: oldCartId }
    }
    const cartItems = await CartItem.findAll(findItemOption)
    const syncCacheTask = CartToolKit.syncCacheTask

    // generate a set of tasks to sync with data inside db
    await Promise.all(
      cartItems.map(item => syncCacheTask(req, item, redisClient))
    )

    // update cartId
    await Cart.update({ id: cartId }, { where: { id: oldCartId } })
  }

  static async syncCartFromCachetoDB(req) {
    const userId = AuthToolKit.getUserId(req)
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient
    const cartKey = `${PREFIX_CART_KEY}:${cartId}`
    const keyPattern = `${PREFIX_CARTITEM_KEY}:${cartId}:*`

    const syncDBTask = CartToolKit.syncDBTask
    await redisClient.hset(cartKey, 'userId', userId)
    const cart = await redisClient.hgetall(cartKey)
    await syncDBTask(cart, 'cart')

    const cartItems = await RedisToolKit.getCacheValues(keyPattern, redisClient)

    return await Promise.all(
      cartItems.map(product => syncDBTask(product, 'cart_item'))
    )
  }

  static async loginSyncCart(req, _, next) {
    // check whether a user logins
    const user = req?.user
    const { firstSyncBit } = req.session

    // Vistor (a user without login)
    // do nothing for sync

    if (!user) return next()

    // if (!user || firstSyncBit) return next()
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
      console.log('isExistInCache ', isExistInCache)
      console.log('isExistInDB ', isExistInDB)

      // case 1: There is nothing on cache and DB
      // do nothing

      switch (true) {
        case (!isExistInCache && !isExistInDB):
          // case 1: There is nothing on cache and DB
          // do nothing
          break

        case (!isExistInCache && isExistInDB):
          // case 2: Except for cache, there is a cart data on DB
          console.log('case 2 syncCartFromDBtoCache')
          await CartPreprocessor.syncCartFromDBtoCache(req)
          break

        case (isExistInCache && !isExistInDB):
          // case 3: Except for DB, there is a cart data on cache
          console.log('case 3 syncCartFromCachetoDB')
          await CartPreprocessor.syncCartFromCachetoDB(req)
          break
        case (isExistInCache && isExistInDB):
          // case 4: There is a cart data on cache and DB
          console.log('case 4 syncCartToDBAndCache')
          // await CartPreprocessor.syncCartToDBAndCache(req)
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
