const express = require('express')
const { userController } = require('../../controllers/user-controller')
const router = express.Router()

router.get('/self', userController.getSelf)
router.put('/self', userController.putSelf)

exports = module.exports = router
