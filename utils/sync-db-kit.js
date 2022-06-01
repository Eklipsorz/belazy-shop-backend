const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

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
}

exports = module.exports = {
  SyncDBKit
}
