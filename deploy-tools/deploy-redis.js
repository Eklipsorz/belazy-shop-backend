
const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { sequelize } = require('../db/models')
const createRedisClient = require('../db/redis')

async function warmup(client) {
  // const stockArray = await sequelize.query(
  //   'SELECT * FROM stock',
  //   { type: sequelize.QueryTypes.SELECT }
  // )

  // const stockArray = [
  //   {
  //     product_id: 100,
  //     quantity: 100,
  //     rest_quantity: 50,
  //     created_at: new Date('2022-05-31T06:58:54.000Z'),
  //     updated_at: new Date('2022-05-31T06:58:54.000Z')
  //   }
  // ]

  // Promise.all([
  //   stockArray.map(product => )
  // ])
}

// warmup()

(async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'warmup'
  const NODE_ENV = process.env.NODE_ENV || 'development'
  const redisConfig = require('../config/redis')[NODE_ENV]
  const redisClient = createRedisClient(redisConfig)
  await redisClient.connect()

  switch (mode) {
    // add hotspot data into redis
    case 'warmup':
      warmup(redisClient)
      break
    // remove hotspot data from redis
    case 'cooldown':
      break
  }
  // await new Promise(r => setTimeout(r, 2000))
  await redisClient.disconnect()
})()
