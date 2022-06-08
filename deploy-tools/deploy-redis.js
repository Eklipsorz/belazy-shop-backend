
const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { sequelize } = require('../db/models')
const createRedisClient = require('../db/redis')
const { RedisToolKit } = require('../utils/redis-tool-kit')
const _ = require('lodash')

async function warmup(client) {
  const stockArray = await sequelize.query(
    'SELECT * FROM stock',
    { type: sequelize.QueryTypes.SELECT }
  )

  async function hashSetTask(product) {
    const productId = product.product_id
    const key = `stock:${productId}`

    delete product.id
    delete product.product_id
    product.dirtyBit = 0
    product.refreshAt = RedisToolKit.getRefreshAt(new Date())

    return await Promise.all(
      Object.entries(product).map(([hashKey, hashValue]) => {
        hashKey = _.camelCase(hashKey)
        return client.hset(key, hashKey, hashValue)
      })
    )
  }

  return await Promise.all(
    stockArray.map(hashSetTask)
  )
}

async function cooldown(client) {
  const keys = await client.keys('stock:*')
  if (!keys.length) {
    console.log('none')
    return
  }
  return await client.del(keys)
}

(async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'warmup'
  const NODE_ENV = process.env.NODE_ENV || 'development'
  const redisConfig = require('../config/redis')[NODE_ENV]
  console.log('node_env', NODE_ENV, redisConfig)
  const redisClient = createRedisClient(redisConfig)
  console.log('inside')
  switch (mode) {
    // add hotspot data into redis
    case 'warmup':
      await warmup(redisClient)
      break
    // remove hotspot data from redis
    case 'cooldown':
      await cooldown(redisClient)
      break
  }
  await redisClient.quit()
})()
