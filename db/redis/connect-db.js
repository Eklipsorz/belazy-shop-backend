const redis = require('redis')

function createRedisClient({ username, password, host, port }) {
  const url = `redis://${username}:${password}@${host}:${port}`
  const client = redis.createClient({ url, legacyMode: true })
  client.connect().catch(console.error)
  client.on('error', (err) => console.log('Redis Client Error: ', err))

  return client
}

exports = module.exports = createRedisClient
