
const { adminMiddleware } = require('../../config/route')
const { adminController } = require('../../controllers/admin')

const express = require('express')
const router = express.Router()

const controller = adminController
const middleware = adminMiddleware

router.get('/self', ...middleware.getSelf, controller.getSelf)
router.put('/self', ...middleware.putSelf, controller.putSelf)

router.get('/categories/products', ...middleware.getProductsFromCategories, controller.getProductsFromCategories)
router.get('/categories/:categoryId/products', ...middleware.getProductsFromCategory, controller.getProductsFromCategory)
router.get('/categories/:categoryId', ...middleware.getCategory, controller.getCategory)
router.get('/categories', ...middleware.getCategories, controller.getCategories)

router.get('/products/:productId', ...middleware.getProduct, controller.getProduct)
router.get('/products', ...middleware.getProducts, controller.getProducts)

exports = module.exports = router
