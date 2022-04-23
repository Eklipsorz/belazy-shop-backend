const express = require('express')
const userRoutes = require('./modules/users.js')
const { APIErrorHandler } = require('../middlewares/api-error-handler')
const router = express.Router()

router.use('/users', userRoutes)

router.use(APIErrorHandler)
exports = module.exports = router
