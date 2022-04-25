const express = require('express')
const { userController } = require('../../controllers/user-controller')
const router = express.Router()

router.get('/self', userController.getSelf)

exports = module.exports = router
