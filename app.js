
const { projectSettings } = require('./config/project')
require('dotenv').config({ path: projectSettings.ENVDIR })

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
app.get('/', (req, res) => {
  res.send(`<h1>hi eklipsorz!! this is ${process.env.NODE_ENV} mode</h1>`)
})
app.use(routes)
console.log('process env', process.env)
app.listen(PORT, () => {
  console.log(`The express server is running at ${PORT}`)
})
