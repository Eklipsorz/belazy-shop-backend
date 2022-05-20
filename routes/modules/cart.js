
const { cartController } = require('../../controllers/cart')
const { cartMiddleware } = require('../../config/route')

const express = require('express')
const router = express.Router()

const middleware = cartMiddleware
const controller = cartController

router.post('/', ...middleware.postCarts, controller.postCarts)

exports = module.exports = router
