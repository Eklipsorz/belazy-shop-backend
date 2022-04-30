const express = require('express')
const { productController } = require('../../controllers/product')
const { paging } = require('../../middlewares/pager')
const router = express.Router()

router.get('/:productId', productController.getProduct)
router.get('/', paging, productController.getProducts)

exports = module.exports = router
