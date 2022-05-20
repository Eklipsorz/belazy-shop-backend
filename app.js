
require('dotenv').config()
const cors = require('cors')
const express = require('express')
// const routes = require('./routes')
const redis = require('redis')
const redisURL = process.env.PROD_REDIS_URL
const client = redis.createClient({ url: redisURL })
const PORT = parseInt(process.env.PORT) || 8080

const app = express()
// app.use((req, res, next) => {
//   if (req.protocol === 'http') {
//     res.redirect(301, `https://${req.headers.host}${req.url}`)
//   }
//   return next()
// })
// app.use(cors())
// app.use(express.json())
// app.get('/', (req, res) => {
//   res.send(`<h1>hi eklipsorz!! this is ${process.env.NODE_ENV} mode</h1>`)
// })
// app.use(routes)
client.on('error', (err) => console.log('Redis Client Error', err))
app.get('/', async (req, res, next) => {
  await client.connect()
  await client.set('key', 'value1')
  const value = await client.get('key')
  res.send(value)
})
app.get('/get', async (req, res, next) => {
  await client.connect()
  const value = await client.get('key')
  res.send(`in get route: ${value}`)
})
app.get('/close', async (req, res, next) => {
  await client.disconnect()
  res.send('disconnected')
})

app.listen(PORT, () => {
  console.log(`The express servert is running at ${PORT}`)
})
