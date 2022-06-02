const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { Stock } = require('../db/models')
const config = require('../config/app').utility.SyncDBKit

class SyncDBKit {
  static setExpiredAt(date) {
    const currentDate = date.valueOf()
    const baseDays = config.BASEDAYS
    const minMinute = config.MINRANGE.MIN
    const maxMinute = config.MINRANGE.MAX
    const randomMin = Math.floor(Math.random() * (maxMinute - minMinute + 1)) + minMinute

    const expiredAt = (currentDate + baseDays * 86400000 + randomMin * 60000)
    return new Date(expiredAt)
  }

  static async syncDBFromCache(object, findOption, cache) {
    let { dirtyBit, expiredAt } = object
    dirtyBit = Number(dirtyBit)

    expiredAt = new Date(expiredAt)
    const currentTime = new Date()

    // test data
    // expiredAt = new Date('Fri Jun 01 2022 23:51:04 GMT+0800 (台北標準時間)')

    // dirtyBit = 1

    if (currentTime.valueOf() > expiredAt.valueOf() && dirtyBit) {
      // initialize dirtyBit and expiredAt
      const target = Object.values(findOption.where)[0]

      await cache.hset(`stock:${target}`, 'dirtyBit', 0)
      await cache.hset(`stock:${target}`, 'expiredAt', SyncDBKit.setExpiredAt(currentTime))
      // sync to DB based on Disk/SSD:
      // - normalize data from cache
      // - update the data to DB based on Disk/SSD
      delete object.dirtyBit
      delete object.expiredAt
      object.createdAt = new Date(object.createdAt)
      object.updatedAt = new Date(object.updatedAt)
      await Stock.update({ ...object }, findOption)
    }
  }
}

exports = module.exports = {
  SyncDBKit
}
