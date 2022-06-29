
const { project } = require('./config/project')
require('dotenv').config({ path: project.ENV })

const { SESSION_SECRET } = require('./config/env').ENV

const NODE_ENV = process.env.NODE_ENV || 'development'
const redisConfig = require('./config/redis')[NODE_ENV]
const createRedisClient = require('./db/redis')
const redisClient = createRedisClient(redisConfig)

const session = require('express-session')
const RedisStore = require('connect-redis')(session)

const cors = require('cors')
const express = require('express')
const routes = require('./routes')

const { PORT } = require('./config/env').ENV

const app = express()

app.locals.redisClient = redisClient
app.locals.redisStore = new RedisStore({ client: redisClient })

// app.use((req, res, next) => {
//   if (req.protocol === 'http') {
//     return res.redirect(301, `https://${req.headers.host}${req.url}`)
//   }
//   return next()
// })

// app.enable('trust proxy')
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
  res.send(`<h1>hi eklipsorz!! this is ${process.env.NODE_ENV} mode. protocol: ${req.protocol}</h1>`)
})

app.use(routes)

app.listen(PORT, async () => {
  if (NODE_ENV === 'production') {
    console.log('port: ', process.env.PORT)
    const { RedisToolKit } = require('./utils/redis-tool-kit')
    await redisClient.flushall()
    await RedisToolKit.stockWarmup(redisClient)
    await RedisToolKit.productWarmup(redisClient)
  }
  console.log(`The express server verion is running at ${PORT}`)
})
