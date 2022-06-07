
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

  // a task template for synchronizing cache
  static async syncCacheTask(product, cache) {
    const { cartId, productId } = product
    const key = `cart:${cartId}:${productId}`
    const refreshAt = await RedisToolKit.setRefreshAt(new Date())

    const template = {
      ...product,
      dirtyBit: 0,
      refreshAt: refreshAt
    }
    if (template.id) delete template.id

    return await cache.hset(key, template)
  }

  // a task template for synchronizing db
  static async syncDBTask(product) {
    const { cartId, productId } = product

    const template = {
      cartId,
      price: Number(product.price),
      quantity: Number(product.quantity),
      productId: Number(productId),
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    }

    const findOption = {
      where: { cartId, productId },
      defaults: template
    }
    // create a record if there is nothing about cartId and productId
    // update the record if there is a cart data with cartId and productId
    const [cart, created] = await Cart.findOrCreate(findOption)
    if (!created) await cart.update(product)
  }

  // sync db and cache
  static async syncCartToDBAndCache(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const keyPattern = `cart:${cartId}:*`
    const findOption = {
      where: { cartId },
      raw: true
    }
    // get all cart from cache and db
    const cacheResult = await RedisToolKit.getCacheValues('cart', keyPattern, redisClient)
    const dbResult = await Cart.findAll(findOption)

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

    const syncDBTask = CartPreprocessor.syncDBTask
    // generate a set of task to sync db
    await Promise.all(
      resultProduct.map(syncDBTask)
    )

    const syncCacheTask = CartPreprocessor.syncCacheTask

    // generate a set of task to sync cache
    await Promise.all(
      resultProduct.map(product => syncCacheTask(product, redisClient))
    )
  }

  // sync cache with data in db
  static async syncCartFromDBtoCache(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const findOption = {
      where: { cartId },
      raw: true
    }
    const carts = await Cart.findAll(findOption)
    const syncCacheTask = CartPreprocessor.syncCacheTask
    return await Promise.all(
      carts.map(cart => syncCacheTask(cart, redisClient))
    )
  }

  static async syncCartFromCachetoDB(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    let cursor = '0'
    let keys = []

    async function syncDBTask(key, cache) {
      const product = await cache.hgetall(key)
      return await CartPreprocessor.syncDBTask(product)
    }

    while (true) {
      [cursor, keys] = await redisClient.scan(cursor, 'MATCH', `cart:${cartId}:*`)
      await Promise.all(
        keys.map(key => syncDBTask(key, redisClient))
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
        redisClient.scan(0, 'MATCH', `cart:${cartId}:*`),
        Cart.findOne({ where: { cartId } })
      ])

      // true -> there exists cart data in cache or db
      // false -> there is nothing data in cache or db
      const isExistInCache = Boolean(cartInCache[1].length)
      const isExistInDB = Boolean(cartInDB)

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
