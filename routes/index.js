const express = require('express')
const userRoutes = require('./modules/users')
const adminRoutes = require('./modules/admin')
const productRoutes = require('./modules/product')

const { userController } = require('../controllers/user')
const { adminController } = require('../controllers/admin')
const { APIErrorHandler } = require('../middlewares/api-error-handler')

const {
  authenticate,
  authenticateUser,
  authenticateAdmin
} = require('../middlewares/authenticator')
const router = express.Router()

// 前台登入
router.post('/users/login', userController.login)

// 前台註冊
router.post('/users', userController.register)

// 後台登入
router.post('/admin/login', adminController.login)

router.use('/users', authenticate, authenticateUser, userRoutes)
router.use('/products', authenticate, authenticateUser, productRoutes)
router.use('/admin', authenticate, authenticateAdmin, adminRoutes)

router.use(APIErrorHandler)
exports = module.exports = router
