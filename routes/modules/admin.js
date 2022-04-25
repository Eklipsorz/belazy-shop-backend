const express = require('express')
const { adminController } = require('../../controllers/admin-controller')
const router = express.Router()

router.get('/self', adminController.getSelf)

exports = module.exports = router
