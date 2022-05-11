const express = require('express')
const userRoutes = require('./modules/users')
const adminRoutes = require('./modules/admin')
const categoryRoutes = require('./modules/category')
const productRoutes = require('./modules/product')

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

// login for admin
router.post('/admin/login', ...middleware.adminLogin, adminController.login)

router.use('/categories', ...middleware.categories, categoryRoutes)
router.use('/products', ...middleware.products, productRoutes)
router.use('/users', ...middleware.users, userRoutes)
router.use('/admin', ...middleware.admin, adminRoutes)

router.use(APIErrorHandler)
exports = module.exports = router
