
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
    async function hashSetTask(cart) {
      const { id, cartId } = cart
      const key = `cart:${cartId}:${id}`
      await Promise.all(
        Object.entries(cart).map(([hashKey, hashvalue]) =>
          redisClient.hset(key, hashKey, hashvalue)
        )
      )
    }

    await Promise.all(
      carts.map(hashSetTask)
    )
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
      console.log('hiiii')
      const [cartInCache, cartInDB] = await Promise.all([
        redisClient.hgetall(`cart:${cartId}`),
        Cart.findOne({ where: { cartId } })
      ])

      // cartInCache
      console.log('cache: ', cartInCache)
      console.log('db: ', cartInDB)

      // case 1: There is nothing on cache and DB
      // dothing

      // case 2: Except for cache, there is a cart data on DB
      if (!Object.keys(cartInCache).length && cartInDB) {
        console.log('case 2')
        await CartPreprocessor.syncCartFromDBtoCache(req)
      }
      // case 3: Except for DB, there is a cart data on cache

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
