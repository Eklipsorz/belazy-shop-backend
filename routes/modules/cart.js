
const { cartController } = require('../../controllers/cart')
const { cartMiddleware } = require('../../config/route')

const express = require('express')
const { Router } = require('express')
const router = express.Router()

const middleware = cartMiddleware
const controller = cartController

router.post('/', ...middleware.postCarts, controller.postCarts)
router.delete('/product', ...middleware.deleteProduct, controller.deleteProduct)
router.delete('/products', ...middleware.deleteProducts, controller.deleteProducts)
exports = module.exports = router
