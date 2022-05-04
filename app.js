if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

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
  res.send(`<h1>hi apple ${process.env.MY_VAR} ${process.env.NODE_ENV}</h1>`)
})
app.get('/.well-known/pki-validation/:something', (req, res) => {
  const file = `${__dirname}/.well-known/pki-validation/654502BBFBBDD117695EFD0DB6504378.txt`
  res.download(file) // Set disposition and send it.
  // res.send('<h1>hi apple</h1>')
})
// app.use(routes)

app.listen(PORT, () => {
  console.log(`The express server is running at ${PORT}`)
})
