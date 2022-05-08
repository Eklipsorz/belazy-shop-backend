const express = require('express')
const { productController } = require('../../controllers/product')
const { paging } = require('../../middlewares/pager')
const router = express.Router()

router.get('/search/hints', productController.getSearchHints)
router.get('/categories/search', paging, productController.searchCategory)
router.get('/search', paging, productController.searchProduct)

router.get('/:productId', productController.getProduct)
router.get('/', paging, productController.getProducts)

exports = module.exports = router
