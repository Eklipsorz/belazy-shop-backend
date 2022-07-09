const { orderController } = require('../../controllers/order')
const { orderMiddleware } = require('../../config/route')
const express = require('express')
const router = express.Router()

const controller = orderController
const middleware = orderMiddleware

router.post('/', ...middleware.postOrders, controller.postOrders)

exports = module.exports = router
