const redis = require('redis')

function createRedisClient({ username, password, host, port }) {

  const url = `redis://${username}:${password}@${host}:${port}`
  const client = redis.createClient({ url })

  client.on('error', (err) => console.log('Redis Client Error: ', err))
  console.log('inside : ', url)
  return client
}

exports = module.exports = createRedisClient
