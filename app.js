
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const routes = require('./routes')
const PORT = process.env.NODE_PORT || 3000
const app = express()


app.use(routes)

app.listen(PORT, () => {
  console.log(`The express server is running at ${PORT}`)
})

