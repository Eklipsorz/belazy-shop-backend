const express = require('express')
const userRoutes = require('./modules/users.js')
const adminRoutes = require('./modules/admin.js')
const { userController } = require('../controllers/user-controller')
const { adminController } = require('../controllers/admin-controller')
const { APIErrorHandler } = require('../middlewares/api-error-handler')
const {
  authenticate,
  authenticateUser,
  authenticateAdmin
} = require('../middlewares/auth-handler')
const router = express.Router()

// 前台登入
router.post('/users/login', userController.login)

// 前台註冊
router.post('/users', userController.register)

// 後台登入
router.post('/admin/login', adminController.login)

router.use('/users', authenticate, authenticateUser, userRoutes)
router.use('/admin', authenticate, authenticateAdmin, adminRoutes)

router.use(APIErrorHandler)
exports = module.exports = router
