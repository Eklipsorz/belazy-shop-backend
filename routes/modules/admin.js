const express = require('express')
const { adminController } = require('../../controllers/admin')
const { paging } = require('../../middlewares/pager')
const router = express.Router()

router.get('/self', adminController.getSelf)
router.put('/self', adminController.putSelf)

router.get('/categories', paging, adminController.getCategories)
router.get('/products/:productId', adminController.getProduct)
router.get('/products', paging, adminController.getProducts)

exports = module.exports = router
