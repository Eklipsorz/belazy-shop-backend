const express = require('express')
const userRoutes = require('./modules/users.js')
const router = express.Router()



router.use('/users', userRoutes)


exports = module.exports = router