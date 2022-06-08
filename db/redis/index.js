const Redis = require('ioredis')

function createRedisClient({ username, password, host, port }) {
  const url = `redis://${username}:${password}@${host}:${port}`
  console.log('redis url', url)
  const redis = new Redis(url)
  return redis
}

exports = module.exports = createRedisClient
