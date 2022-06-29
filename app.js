
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

const { HTTP_PORT, HTTPS_PORT } = require('./config/env').ENV

const fs = require('fs')
const http = require('http')
const https = require('https')
const app = express()

const httpsOption = {
  key: fs.readFileSync(__dirname + '/config/ssl/app/api-belazy-shop-backend.key'),
  cert: fs.readFileSync(__dirname + '/config/ssl/app/api-belazy-shop-backend.crt')
}

app.locals.redisClient = redisClient
app.locals.redisStore = new RedisStore({ client: redisClient })

app.use((req, res, next) => {
  if (req.protocol === 'http') {
    res.writeHead(301, { Location: 'https://' + req.headers.host.replace(HTTP_PORT, HTTPS_PORT) + req.url })
    return res.end()
  }
  return next()
})

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

const httpServer = http.createServer(app)
const httpsServer = https.createServer(httpsOption, app)
console.log('port: ', process.env.PORT)
httpServer.listen(HTTP_PORT, async () => {
  console.log(`The express server http verion is running at ${HTTP_PORT}`)
})

httpsServer.listen(HTTPS_PORT, async () => {
  if (NODE_ENV === 'production') {
    const { RedisToolKit } = require('./utils/redis-tool-kit')
    await redisClient.flushall()
    await RedisToolKit.stockWarmup(redisClient)
    await RedisToolKit.productWarmup(redisClient)
  }
  console.log(`The express server https verion is running at ${HTTPS_PORT}`)
})
