
const { project } = require('./config/project')
require('dotenv').config({ path: project.ENV })

const { Worker, workerData } = require('worker_threads')
const { SESSION_SECRET, PORT } = require('./config/env').ENV

const NODE_ENV = process.env.NODE_ENV || 'development'
const redisConfig = require('./config/redis')[NODE_ENV]
const createRedisClient = require('./db/redis')
const redisClient = createRedisClient(redisConfig)

const session = require('express-session')
const RedisStore = require('connect-redis')(session)

const cors = require('cors')
const express = require('express')
const routes = require('./routes')

const app = express()

app.locals.redisClient = redisClient
app.locals.redisStore = new RedisStore({ client: redisClient })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  session({
    store: app.locals.redisStore,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    resave: false,
    cookie: {
      secure: NODE_ENV === 'production',
      httpOnly: true
    }
  })
)

app.get('/', async (req, res) => {
  return res.send(`<h1>hi eklipsorz!! this is ${process.env.NODE_ENV} mode. </h1>`)
})

app.use(routes)

app.listen(PORT, async () => {
  const option = { NODE_ENV }
  const worker = new Worker(__dirname + '/daemons/reset-password-mailer.js', { workerData: option })
  if (NODE_ENV === 'production') {
    console.log('port: ', process.env.PORT)
    const { RedisToolKit } = require('./utils/redis-tool-kit')
    await redisClient.flushall()
    await RedisToolKit.stockWarmup(redisClient)
    await RedisToolKit.productWarmup(redisClient)
  }
  console.log(`The express server is running at ${PORT} `)
})
