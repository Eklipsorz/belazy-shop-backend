const { userController } = require('../../controllers/user')
const { userMiddleware } = require('../../config/route')

const express = require('express')
const router = express.Router()

const middleware = userMiddleware
const controller = userController

router.get('/self', ...middleware.getSelf, controller.getSelf)
router.put('/self', ...middleware.putSelf, controller.putSelf)

exports = module.exports = router
