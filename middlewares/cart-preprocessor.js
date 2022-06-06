
const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')
const { Cart } = require('../db/models')
const { v4: uuidv4 } = require('uuid')

class CartPreprocessor {
  static getSession(req, _, next) {
    if (req.session && req.session.cartId) {
      console.log('exist session: ', req.session)
      return next()
    }
    req.session.cartId = uuidv4()
    req.session.firstSyncBit = false
    console.log('nothing: ', req.session)
    return next()
  }

  static async syncCartFromDBtoCache(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    const findOption = {
      where: { cartId },
      raw: true
    }
    const carts = await Cart.findAll(findOption)

    async function CacheSyncTask(cart) {
      const { cartId, productId } = cart
      const key = `cart:${cartId}:${productId}`

      delete cart.id
      delete cart.cartId
      delete cart.productId

      await Promise.all(
        Object.entries(cart).map(([hashKey, hashvalue]) =>
          redisClient.hset(key, hashKey, hashvalue)
        )
      )
    }

    return await Promise.all(
      carts.map(CacheSyncTask)
    )
  }

  static async syncCartFromCachetoDB(req) {
    const { cartId } = req.session
    const redisClient = req.app.locals.redisClient

    async function DBSyncTask(key) {
      const [_, cartId, productId] = key.split(':')
      const resultCart = await redisClient.hgetall(key)

      resultCart.cartId = cartId
      resultCart.productId = Number(productId)
      resultCart.createdAt = new Date(resultCart.createdAt)
      resultCart.updatedAt = new Date(resultCart.updatedAt)
      delete resultCart.firstSyncBit

      return await Cart.create(resultCart)
    }

    let cursor = '0'
    let keys = []

    while (true) {
      [cursor, keys] = await redisClient.scan(cursor, 'MATCH', `cart:${cartId}:*`)
      await Promise.all(
        keys.map(DBSyncTask)
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

      const [cartInCache, cartInDB] = await Promise.all([
        redisClient.scan(0, 'MATCH', `cart:${cartId}:*`, 'COUNT', 1),
        Cart.findOne({ where: { cartId } })
      ])

      // cartInCache
      console.log('cache: ', cartInCache, cartInCache[1].length)
      console.log('db: ', cartInDB)

      // case 1: There is nothing on cache and DB
      // dothing

      // case 2: Except for cache, there is a cart data on DB
      if (!cartInCache[1].length && cartInDB) {
        console.log('case 2')
        await CartPreprocessor.syncCartFromDBtoCache(req)
      }
      // case 3: Except for DB, there is a cart data on cache
      if (cartInCache[1].length && !cartInDB) {
        console.log('case 3')
        await CartPreprocessor.syncCartFromCachetoDB(req)
      }

      // case 4: There is a cart data on cache and DB
      console.log('end')
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
