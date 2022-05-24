const redis = require('redis')

function createRedisClient({ username, password, host, port }) {
  const url = `redis://${username}:${password}@${host}:${port}`
  const redisClient = redis.createClient({ url })
  return redisClient
}

exports = module.exports = createRedisClient
