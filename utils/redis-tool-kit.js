const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { status, code } = require('../config/result-status-table').errorTable
const { APIError } = require('../helpers/api-error')

const { Stock } = require('../db/models')
const config = require('../config/app').utility.RedisToolKit

class RedisToolKit {
  static getRefreshAt(date) {
    const currentDate = date.valueOf()
    const baseDays = config.BASEDAYS
    const minMinute = config.MINRANGE.MIN
    const maxMinute = config.MINRANGE.MAX
    const randomMin = Math.floor(Math.random() * (maxMinute - minMinute + 1)) + minMinute

    const refreshAt = (currentDate + baseDays * 86400000 + randomMin * 60000)
    return new Date(refreshAt)
  }

  static async setExpireAt(key, expireAt, cache) {
    const resultExpireAt = Math.floor(new Date(expireAt).getTime() / 1000)
    return await cache.expireat(key, resultExpireAt)
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

  static async syncDBFromCache(findOption, cache, object = null) {
    const target = Object.values(findOption.where)[0]
    const resultObject = !object ? await cache.hgetall(`stock:${target}`) : object

    if (!resultObject) {
      throw new APIError({ code: code.SERVERERROR, status, message: '在緩存上找不到對應鍵值' })
    }

    const dirtyBit = Number(resultObject.dirtyBit)
    const currentTime = new Date()
    const refreshAt = new Date(resultObject.refreshAt)
    // test data
    // refreshAt = new Date('Fri Jun 01 2022 23:51:04 GMT+0800 (台北標準時間)')
    // dirtyBit = 1

    if (currentTime.valueOf() > refreshAt.valueOf() && dirtyBit) {
      // initialize dirtyBit and expiredAt
      await cache.hset(`stock:${target}`, 'dirtyBit', 0)
      await cache.hset(`stock:${target}`, 'refreshAt', RedisToolKit.getRefreshAt(currentTime))
      // sync to DB based on Disk/SSD:
      // - normalize data from cache
      // - update the data to DB based on Disk/SSD
      delete resultObject.dirtyBit
      delete resultObject.refreshAt
      resultObject.createdAt = new Date(resultObject.createdAt)
      resultObject.updatedAt = new Date(resultObject.updatedAt)
      await Stock.update({ ...resultObject }, findOption)
    }
  }
}

exports = module.exports = {
  RedisToolKit
}
