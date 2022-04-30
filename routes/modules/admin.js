const express = require('express')
const { adminController } = require('../../controllers/admin')
const router = express.Router()

router.get('/self', adminController.getSelf)
router.put('/self', adminController.putSelf)

exports = module.exports = router
