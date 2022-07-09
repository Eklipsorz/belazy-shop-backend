
const { cartController } = require('../../controllers/cart')
const { cartMiddleware } = require('../../config/route')

const express = require('express')
const router = express.Router()

const middleware = cartMiddleware
const preprocessor = middleware.preprocessor
const postprocessor = middleware.postprocessor

const controller = cartController

router.get('/self', ...preprocessor.getCart, controller.getCart, ...postprocessor.getCart)
router.get('/self/items', ...preprocessor.getCartItems, controller.getCartItems, ...postprocessor.getCartItems)
router.post('/self/items', ...preprocessor.postCartItems, controller.postCartItems, ...postprocessor.postCartItems)
router.put('/self/items', ...preprocessor.putCartItems, controller.putCartItems, ...postprocessor.putCartItems)
router.delete('/self/items', ...preprocessor.deleteCartItem, controller.deleteCartItem, ...postprocessor.deleteCartItem)
router.delete('/self', ...preprocessor.deleteCart, controller.deleteCart, ...postprocessor.deleteCart)
router.post('/self/purchase', preprocessor.postCartPurchase, controller.postCartPurchase, ...postprocessor.postCartPurchase)
exports = module.exports = router
