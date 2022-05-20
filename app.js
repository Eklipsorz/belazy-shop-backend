
require('dotenv').config()
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
// app.use(cors())
// app.use(express.json())
// app.get('/', (req, res) => {
//   res.send(`<h1>hi eklipsorz!! this is ${process.env.NODE_ENV} mode</h1>`)
// })
// app.use(routes)
async function main(projectId, location) {
  const { CloudRedisClient } = require('@google-cloud/redis')
  const client = new CloudRedisClient()
  const formattedParent = client.locationPath(projectId, location)
  const request = {
    parent: formattedParent
  }
  const resp = (await client.listInstances(request))[0]
  console.log(resp)
}
// [END redis_quickstart]

main('shop-cache', 'asia-east1').catch(err => {
  console.error(err)
  process.exitCode = 1
})

app.listen(PORT, () => {
  console.log(`The express server is running at ${PORT}`)
})
