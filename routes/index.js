const express = require('express')
const userRoutes = require('./modules/users.js')
const adminRoutes = require('./modules/admin.js')
const { APIErrorHandler } = require('../middlewares/api-error-handler')
const router = express.Router()

router.use('/users', userRoutes)
router.use('/admin', adminRoutes)

router.use(APIErrorHandler)
exports = module.exports = router
