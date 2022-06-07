
const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { Cart } = require('../db/models')
const { RedisToolKit } = require('../utils/redis-tool-kit')
const { v4: uuidv4 } = require('uuid')

class CartPreprocessor {
  static getSession(req, _, next) {
    if (req.session && req.session.cartId) {
      return next()
    }
    req.session.cartId = uuidv4()
    req.session.firstSyncBit = false

    return next()
  }

  static async syncCartToDBAndCache(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const keyPattern = `cart:${cartId}:*`
    const findOption = {
      where: { cartId },
      raw: true
    }

    const cacheResult = await RedisToolKit.getCacheValues('cart', keyPattern, redisClient)
    const dbResult = await Cart.findAll(findOption)

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

    const resultProduct = Object.values(productHash).map(value => ({ ...value }))

    async function syncDBTask(product) {
      const productId = Number(product.productId)

      delete product.dirtyBit
      delete product.refreshAt
      product.cartId = cartId
      product.createdAt = new Date(product.createdAt)
      product.updatedAt = new Date()

      const findOption = {
        where: { cartId, productId },
        defaults: { ...product }
      }
      const [cart, created] = await Cart.findOrCreate(findOption)
      if (!created) {
        await cart.update(product)
      }
    }

    await Promise.all(
      resultProduct.map(syncDBTask)
    )

    async function syncCacheTask(product) {
      const productId = product.productId
      const key = `cart:${cartId}:${productId}`

      delete product.productId
      product.dirtyBit = 0
      product.refreshAt = RedisToolKit.setRefreshAt(new Date())
      product.updatedAt = new Date()
      return await redisClient.hset(key, product)
    }

    await Promise.all(
      resultProduct.map(syncCacheTask)
    )
  }

  static async syncCartFromDBtoCache(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const findOption = {
      where: { cartId },
      raw: true
    }
    const carts = await Cart.findAll(findOption)

    async function CacheSyncTask(cart, cache) {
      const { cartId, productId } = cart
      const key = `cart:${cartId}:${productId}`

      delete cart.id
      delete cart.cartId
      delete cart.productId

      const refreshAt = await RedisToolKit.setRefreshAt(new Date())
      cart.dirtyBit = 0
      cart.refreshAt = refreshAt
      return await cache.hset(key, cart)
    }
    return await Promise.all(
      carts.map(cart => CacheSyncTask(cart, redisClient))
    )
  }

  static async syncCartFromCachetoDB(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    async function DBSyncTask(key, cache) {
      const [_, cartId, productId] = key.split(':')
      const resultCart = await cache.hgetall(key)

      resultCart.cartId = cartId
      resultCart.productId = Number(productId)
      resultCart.createdAt = new Date(resultCart.createdAt)
      resultCart.updatedAt = new Date(resultCart.updatedAt)
      delete resultCart.firstSyncBit
      delete resultCart.dirtyBit
      delete resultCart.refreshAt

      return await Cart.create(resultCart)
    }

    let cursor = '0'
    let keys = []
    console.log('case 2')
    while (true) {
      [cursor, keys] = await redisClient.scan(cursor, 'MATCH', `cart:${cartId}:*`)
      await Promise.all(
        keys.map((key, redisClient) => DBSyncTask(key, redisClient))
      )
      if (cursor === '0') break
    }
  }

  static async syncCart(req, _, next) {
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

      // get cart data from cache and db
      const [cartInCache, cartInDB] = await Promise.all([
        redisClient.scan(0, 'MATCH', `cart:${cartId}:*`, 'COUNT', 1),
        Cart.findOne({ where: { cartId } })
      ])

      // true -> there exists cart data in cache or db
      // false -> there is nothing data in cache or db
      const isExistInCache = Boolean(cartInCache[1].length)
      const isExistInDB = Boolean(cartInDB)

      // case 1: There is nothing on cache and DB
      // dothing

      // case 2: Except for cache, there is a cart data on DB
      if (!isExistInCache && isExistInDB) {
        await CartPreprocessor.syncCartFromDBtoCache(req)
      }
      // case 3: Except for DB, there is a cart data on cache
      if (isExistInCache && !isExistInDB) {
        await CartPreprocessor.syncCartFromCachetoDB(req)
      }

      // case 4: There is a cart data on cache and DB
      if (isExistInCache && isExistInDB) {
        await CartPreprocessor.syncCartToDBAndCache(req)
      }

      // req.session.firstSyncBit = true
      return next()
    } catch (error) {
      return next(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }
}

exports = module.exports = {
  CartPreprocessor
}
