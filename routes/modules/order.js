const { orderController } = require('../../controllers/order')
const { orderMiddleware } = require('../../config/route')
const express = require('express')
const router = express()

const controller = orderController
const middleware = orderMiddleware

router.post('/', ...middleware.postOrders, controller.postOrders)

exports = module.exports = router
