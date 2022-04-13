
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const PORT = process.env.NODE_PORT || 3000
const express = require('express')

const app = express()


app.get('/', () => {
  console.log('test')
})

app.listen(PORT, () => {
  console.log(`The express server is running at ${PORT}`)
})

