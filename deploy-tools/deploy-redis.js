
const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { cache } = require('../config/deployment')
const { sequelize } = require('../db/models')
const createRedisClient = require('../db/redis')

const _ = require('lodash')

function setExpiredAt(date) {
  const currentDate = date.valueOf()
  const baseDays = cache.BASEDAYS
  const minMinute = cache.MINRANGE.MIN
  const maxMinute = cache.MINRANGE.MAX
  const randomMin = Math.floor(Math.random() * (maxMinute - minMinute + 1)) + minMinute

  const expiredAt = (currentDate + baseDays * 86400000 + randomMin * 60000)
  return new Date(expiredAt)
}
const testdate = new Date()
console.log(testdate, setExpiredAt(testdate))

async function warmup(client) {
  const stockArray = await sequelize.query(
    'SELECT * FROM stock',
    { type: sequelize.QueryTypes.SELECT }
  )

  async function hashSetTask(product) {
    const productId = product.product_id
    const stockKey = `stock:${productId}`

    delete product.product_id
    product.dirtyBit = false
    product.expiredAt = setExpiredAt(new Date())

    Object.entries(product).forEach(async ([key, value]) => {
      key = _.camelCase(key)
      await client.hset(stockKey, key, value)
    })
  }

  await Promise.all([
    stockArray.map(hashSetTask)
  ])
}

// warmup()

(async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'warmup'
  const NODE_ENV = process.env.NODE_ENV || 'development'
  const redisConfig = require('../config/redis')[NODE_ENV]
  const redisClient = createRedisClient(redisConfig)

  switch (mode) {
    // add hotspot data into redis
    case 'warmup':
      await warmup(redisClient)
      break
    // remove hotspot data from redis
    case 'cooldown':
      break
  }
  redisClient.quit()
})()
