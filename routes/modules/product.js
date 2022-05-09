const express = require('express')
const { productController } = require('../../controllers/product')
const { ExistURIValidator } = require('../../middlewares/URI-format-validator')
const { paging } = require('../../middlewares/pager')
const { authenticateUser } = require('../../middlewares/authenticator')

const router = express.Router()

router.get('/search/hints', productController.getSearchHints)
router.get('/categories/search', paging, productController.searchProductsFromCategory)
router.get('/search', paging, productController.searchProducts)

router.get('/:productId', ExistURIValidator, productController.getProduct)
router.get('/', paging, productController.getProducts)

exports = module.exports = router
