
const { project } = require('./config/project')
require('dotenv').config({ path: project.ENV })

const NODE_ENV = process.env.NODE_ENV || 'development'
const redisConfig = require('./config/redis')[NODE_ENV]
const createRedisClient = require('./db/redis/connect-db')
const client = createRedisClient(redisConfig)

const cors = require('cors')
const express = require('express')
const routes = require('./routes')

const PORT = parseInt(process.env.PORT) || 8080

const app = express()
// app.use((req, res, next) => {
//   if (req.protocol === 'http') {
//     res.redirect(301, `https://${req.headers.host}${req.url}`)
//   }
//   return next()
// })
app.use(cors())
app.use(express.json())

app.get('/', async (req, res, next) => {
  await client.connect()
  await client.set('key', 'value1')
  const value = await client.get('key')
  res.send(`hi ${value}`)
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
// app.get('/', (req, res) => {
//   res.send(`<h1>hi eklipsorz!! this is ${process.env.NODE_ENV} mode</h1>`)
// })
// app.use(routes)

app.listen(PORT, () => {
  console.log(`The express server is running at ${PORT}`)
})
