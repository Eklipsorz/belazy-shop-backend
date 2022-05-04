
const { ENV } = require('./config/env')

const express = require('express')
// const routes = require('./routes')

const PORT = parseInt(process.env.PORT) || 8080

const app = express()
// app.use((req, res, next) => {
//   if (req.protocol === 'http') {
//     res.redirect(301, `https://${req.headers.host}${req.url}`)
//   }
//   return next()
// })

app.use(express.json())
app.get('/', (req, res) => {
  console.log('all env: ', ENV)
  res.send(`<h1>hi apple ${ENV.ACCESS_TOKEN_SECRET} ${ENV.SEEDER_EMAIL_PREFIX}</h1>`)
})

// app.use(routes)

app.listen(PORT, () => {
  console.log(`The express server is running at ${PORT}`)
})
