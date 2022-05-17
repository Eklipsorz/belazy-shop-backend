const { replyController } = require('../../controllers/reply')
const { replyMiddleware } = require('../../config/route')
const express = require('express')
const router = express.Router()

const controller = replyController
const middleware = replyMiddleware

router.delete('/:replyId', ...middleware.deleteReply, controller.deleteReply)
router.put('/:replyId', ...middleware.putReply, controller.putReply)

exports = module.exports = router
