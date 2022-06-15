
const { cartController } = require('../../controllers/cart')
const { cartMiddleware } = require('../../config/route')

const express = require('express')
const router = express.Router()

const middleware = cartMiddleware
const preprocessor = middleware.preprocessor
const postprocessor = middleware.postprocessor

const controller = cartController

router.get('/self/items', ...preprocessor.getCartItems, controller.getCartItems, ...postprocessor.getCartItems)
router.post('/self/items', ...preprocessor.postCartItems, controller.postCartItems, ...postprocessor.postCartItems)
router.put('/self', ...preprocessor.putCart, controller.putCart, ...postprocessor.putCart)
router.delete('/self/items', ...middleware.deleteCartItem, controller.deleteCartItem)
router.delete('/self', ...middleware.deleteCart, controller.deleteCart)
exports = module.exports = router
