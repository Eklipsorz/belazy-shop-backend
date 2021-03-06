const { orderController } = require('../../controllers/order')
const { orderMiddleware } = require('../../config/route')
const express = require('express')
const router = express.Router()

const controller = orderController
const middleware = orderMiddleware

// postOrders API is not opened temporary for client because of security
// router.post('/', ...middleware.postOrders, controller.postOrders)
router.get('/:orderId', ...middleware.getOrder, controller.getOrder)
router.get('/', ...middleware.getOrders, controller.getOrders)

exports = module.exports = router
