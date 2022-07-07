const fs = require('fs')
const { project } = require('../../config/project')

const {
  DEFAULT_LOCKTIME,
  DEFAULT_TIMEOUT,
  DEFAULT_EXPIRY_MODE,
  DEFAULT_SET_MODE,
  DEFAULT_SLEEP_PERIOD,
  DEFAULT_REFRESH_PERIOD
} = require('../../config/app').service.redisLock

class RedisLock {
  constructor(client, option = {}) {
    if (!client) throw new Error('並未存在對應redis client')
    if (client.status !== 'connecting') throw new Error('redis client 並未正常連接 redis')
    this.client = client
    this.lockTime = option.lockTime || DEFAULT_LOCKTIME
    this.lockTimeOut = option.lockTimeOut || DEFAULT_TIMEOUT
    this.expireMode = option.expireMode || DEFAULT_EXPIRY_MODE
    this.setMode = option.setMode || DEFAULT_SET_MODE
  }

  async lock(key, id, time) {
    const start = Date.now()
    const self = this
    const expireTime = time || self.lockTime
    const { expireMode, setMode, lockTimeOut } = self
    const period = DEFAULT_SLEEP_PERIOD

    return (async function lockTask() {
      try {
        const result = await self.client.set(key, id, expireMode, expireTime, setMode)
        if (result === 'OK') {
          console.log(`lock ${key}: ${id} is locked`)
          return true
        }
        if (Math.floor(Date.now() - start) > lockTimeOut) return false
        console.log(`lock ${key}: ${id} waits`)
        await self.sleep(period)
        console.log(`lock ${key}: ${id} goes`)
        return lockTask()
      } catch (error) {
        throw new Error(error)
      }
    })()
  }

  async unlock(key, id) {
    const self = this
    try {
      const script = fs.readFileSync(project.ROOT + '/scripts/check-and-delete.lua')
      const result = await self.client.eval(script, 1, key, id)

      if (result === 1) {
        console.log(`lock ${key}: ${id} is unlocked`)
        return true
      }
      return false
    } catch (error) {
      throw new Error(error)
    }
  }

  async refresh(key, id, time) {
    const self = this
    const lockId = id
    const period = time || DEFAULT_REFRESH_PERIOD
    const expireMode = DEFAULT_EXPIRY_MODE
    const expireTime = DEFAULT_LOCKTIME
    return (async function refreshTask() {
      const currentId = await self.client.get(key)
      if (!currentId || currentId !== lockId) {
        console.log(`lock ${key}: ${id} refresh is cancelled`)
        return true
      }
      console.log(`lock ${key}: ${id} refresh is refreshed`)
      await self.client.set(key, id, expireMode, expireTime)
      await self.sleep(period)
      return refreshTask()
    })()
  }

  sleep(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve()
      }, time)
    })
  }
}

exports = module.exports = {
  RedisLock
}
