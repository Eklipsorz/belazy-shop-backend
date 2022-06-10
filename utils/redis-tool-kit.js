const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')

const { Stock, Product, Cart } = require('../db/models')

const { ParameterValidationKit } = require('./parameter-validation-kit')
const config = require('../config/app').utility.RedisToolKit

class RedisToolKit {
  static correctDataType(object) {
    const entries = Object.entries(object)
    const result = {}
    const { isNaN, isNumberString } = ParameterValidationKit

    entries.forEach(([key, value]) => {
      let resultValue = value
      switch (true) {
        case (isNumberString(value)):
          resultValue = Number(value)
          break
        case (isNaN(Date.parse(value))):
          resultValue = new Date(value)
          break
      }
      result[key] = resultValue
    })
    return result
  }

  static getRefreshAt(key, date) {
    const currentDate = date.getTime()
    const keyType = key.split(':')[0]
    const refreshAtConfig = config.REFRESHAT[keyType]

    const baseDays = refreshAtConfig ? refreshAtConfig.BASEDAYS : 1
    const minMinute = refreshAtConfig ? refreshAtConfig.MINRANGE.MIN : 360
    const maxMinute = refreshAtConfig ? refreshAtConfig.MINRANGE.MAX : 1440

    const randomMin = Math.floor(Math.random() * (maxMinute - minMinute + 1)) + minMinute

    const refreshAt = (currentDate + baseDays * 86400000 + randomMin * 60000)
    return new Date(refreshAt)
  }

  static async setExpireAt(key, expireAt, cache) {
    const resultExpireAt = Math.floor(new Date(expireAt).getTime() / 1000)
    return await cache.expireat(key, resultExpireAt)
  }

  static async hashSetTask(key, object, cache) {
    const onlyReadKeyTypes = config.ONLYREAD_KEYTYPE
    const keyType = key.split(':')[0]
    const template = {
      ...object
    }

    if (!onlyReadKeyTypes.includes(keyType)) {
      template.dirtyBit = 0
      template.refreshAt = RedisToolKit.getRefreshAt(key, new Date())
    }

    if (template.id) delete template.id
    await cache.hset(key, template)
  }

  static getCartHashKey(key) {
    return key.split(':')[2]
  }

  static async getCacheValues(type, keyPattern, cache) {
    let cursor = 0
    let keySet = []
    const cacheResult = []

    let getHashKey = null

    switch (type) {
      case 'cart':
        getHashKey = RedisToolKit.getCartHashKey
        break
    }

    async function hgetallTask(key) {
      const result = await cache.hgetall(key)
      result.productId = getHashKey(key)
      return result
    }

    while (true) {
      [cursor, keySet] = await cache.scan(cursor, 'MATCH', keyPattern)

      const result = await Promise.all(
        keySet.map(hgetallTask)
      )
      cacheResult.push(...result)
      if (cursor === '0') break
    }

    return cacheResult
  }

  static async syncDBFromCache(key, cache, findOption) {
    const syncType = key.split(':')[0]

    const resultObject = await cache.hgetall(key)

    if (!resultObject) {
      throw new APIError({ code: code.SERVERERROR, status, message: '找不到對應鍵值' })
    }

    let dirtyBit = Number(resultObject.dirtyBit)
    const currentTime = new Date()
    let refreshAt = new Date(resultObject.refreshAt)
    // test data
    refreshAt = new Date('Fri Jun 01 2022 23:51:04 GMT+0800 (台北標準時間)')
    // resultObject.quantity = '1312354'
    dirtyBit = 1
    console.log('refresh', currentTime, refreshAt, key)
    if (currentTime.getTime() > refreshAt.getTime() && dirtyBit) {
      // initialize dirtyBit and expiredAt
      const getRefreshAt = RedisToolKit.getRefreshAt
      await cache.hset(key, 'dirtyBit', 0)
      await cache.hset(key, 'refreshAt', getRefreshAt(key, currentTime))
      // sync to DB based on Disk/SSD:
      // - normalize data from cache
      // - update the data to DB based on Disk/SSD
      const { correctDataType } = RedisToolKit
      const template = {
        ...correctDataType(resultObject),
        createAt: new Date(resultObject.createdAt),
        updatedAt: new Date(resultObject.updatedAt)
      }

      const templateKeys = Object.keys(template)
      if (templateKeys.includes('dirtyBit')) delete template.dirtyBit
      if (templateKeys.includes('refreshAt')) delete template.refreshAt

      switch (syncType) {
        case 'stock':
          await Stock.update(template, findOption)
          break
        case 'cart':
          await Cart.update(template, findOption)
          break
        case 'product':
          await Product.update(template, findOption)
          break
      }
    }
  }

  static async stockWarmup(cache) {
    const stock = await Stock.findAll({ raw: true })

    async function stockHashSetTask(product, cache) {
      const productId = product.productId
      const key = `stock:${productId}`
      return await RedisToolKit.hashSetTask(key, product, cache)
    }

    return await Promise.all(
      stock.map(product => stockHashSetTask(product, cache))
    )
  }

  static async stockCooldown(cache) {
    const keys = await cache.keys('stock:*')
    if (!keys.length) return
    return await cache.del(keys)
  }

  static async productWarmup(cache) {
    const findOption = {
      attributes: {
        exclude: ['introduction', 'createdAt', 'updatedAt']
      },
      raw: true
    }

    const products = await Product.findAll(findOption)

    async function productHashSetTask(product, cache) {
      const productId = product.id
      const key = `product:${productId}`
      return await RedisToolKit.hashSetTask(key, product, cache)
    }

    return await Promise.all(
      products.map(product => productHashSetTask(product, cache))
    )
  }
}

exports = module.exports = {
  RedisToolKit
}
