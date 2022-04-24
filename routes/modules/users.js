const express = require('express')
const { userController } = require('../../controllers/user-controller')
const router = express.Router()

router.post('/login', userController.login)
router.post('/', userController.register)

exports = module.exports = router
