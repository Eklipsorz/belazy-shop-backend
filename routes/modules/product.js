const express = require('express')
const { productController } = require('../../controllers/product')
const { ExistURIValidator } = require('../../middlewares/URI-format-validator')
const { paging } = require('../../middlewares/pager')
const { authenticateUser } = require('../../middlewares/authenticator')

const router = express.Router()

router.get('/search/hints', productController.getSearchHints)
router.get('/categories/search', paging, productController.searchCategory)
router.get('/search', paging, productController.searchProduct)

router.get('/:productId', ExistURIValidator, productController.getProduct)
router.get('/', paging, productController.getProducts)

exports = module.exports = router
