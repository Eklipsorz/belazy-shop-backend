const express = require('express')
const userRoutes = require('./modules/user')
const replyRoutes = require('./modules/reply')
const adminRoutes = require('./modules/admin')
const categoryRoutes = require('./modules/category')
const productRoutes = require('./modules/product')
const cartRoutes = require('./modules/cart')

const { generalMiddleware } = require('../config/route')
const { userController } = require('../controllers/user')
const { adminController } = require('../controllers/admin')
const { APIErrorHandler } = require('../middlewares/api-error-handler')

const router = express.Router()

const middleware = generalMiddleware

router.use('/', ...middleware.all)

// login for user
router.post('/users/login', ...middleware.userLogin, userController.login)

// registeration for user
router.post('/users', ...middleware.userRegister, userController.register)

// forgot-password for user
router.post('/users/forgot-password', ...middleware.postForgotPassword, userController.postForgotPassword)

// reset-password verification for user
router.get('/users/reset-password', ...middleware.getResetPassword, userController.getResetPassword)

// reset-password  for user
router.post('/users/reset-password', ...middleware.postResetPassword, userController.postResetPassword)

// login for admin
router.post('/admin/login', ...middleware.adminLogin, adminController.login)

router.use('/carts', ...middleware.carts, cartRoutes)
router.use('/categories', ...middleware.categories, categoryRoutes)
router.use('/products', ...middleware.products, productRoutes)
router.use('/replies', ...middleware.replies, replyRoutes)
router.use('/users', ...middleware.users, userRoutes)
router.use('/admin', ...middleware.admin, adminRoutes)

router.use(APIErrorHandler)
exports = module.exports = router
