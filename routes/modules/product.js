const express = require('express')
const { productController } = require('../../controllers/product-controller')
const { paging } = require('../../middlewares/page-handler')
const router = express.Router()

router.get('/', paging, productController.getProducts)

exports = module.exports = router
