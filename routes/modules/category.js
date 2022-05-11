
const { categoryController } = require('../../controllers/category')
const { categoryMiddleware } = require('../../config/route')
const express = require('express')
const router = express.Router()

const controller = categoryController
const middleware = categoryMiddleware

router.get('/', ...middleware.getCategories, controller.getCategories)
router.get('/products', ...middleware.getProductsFromCategories, controller.getProductsFromCategories)
router.get('/:categoryId/products', ...middleware.getProductsFromCategory, controller.getProductsFromCategory)
router.get('/:categoryId', ...middleware.getCategory, controller.getCategory)

exports = module.exports = router
