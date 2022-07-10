
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

router.post('/products', ...middleware.postProducts, controller.postProducts)
router.put('/products/:productId', ...middleware.putProducts, controller.putProducts)
router.delete('/products/:productId', ...middleware.deleteProducts, controller.deleteProducts)

router.put('/products/:productId/stock', ...middleware.putStack, controller.putStock)
router.get('/products/:productId/stock', ...middleware.getStock, controller.getStock)
router.get('/products/:productId', ...middleware.getProduct, controller.getProduct)
router.get('/products', ...middleware.getProducts, controller.getProducts)

router.post('/orders', ...middleware.postOrders, controller.postOrders)
router.get('/orders/:orderId', ...middleware.getOrder, controller.getOrder)
router.get('/orders', ...middleware.getOrders, controller.getOrders)
exports = module.exports = router
