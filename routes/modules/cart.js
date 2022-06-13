
const { cartController } = require('../../controllers/cart')
const { cartMiddleware } = require('../../config/route')

const express = require('express')
const router = express.Router()

const middleware = cartMiddleware
const preprocessor = middleware.preprocessor
const postprocessor = middleware.postprocessor

const controller = cartController

router.get('/', ...preprocessor.getCart, controller.getCart, ...postprocessor.getCart)
router.post('/', ...preprocessor.postCarts, controller.postCarts, ...postprocessor.postCarts)
router.delete('/product', ...middleware.deleteProduct, controller.deleteProduct)
router.delete('/products', ...middleware.deleteProducts, controller.deleteProducts)
exports = module.exports = router
