const { productController } = require('../../controllers/product')
const { productMiddleware } = require('../../config/route')
const express = require('express')
const router = express.Router()

const middlewares = productMiddleware

router.get('/search/hints', ...middlewares.searchHints, productController.getSearchHints)
router.get('/categories/search', ...middlewares.searchCategory, productController.searchProductsFromCategory)
router.get('/search', ...middlewares.searchProduct, productController.searchProducts)

router.post('/:productId/like', ...middlewares.likeProduct, productController.likeProduct)
router.post('/:productId/unlike', ...middlewares.unlikeProduct, productController.unlikeProduct)

router.get('/:productId', ...middlewares.getProduct, productController.getProduct)
router.get('/', ...middlewares.getProducts, productController.getProducts)

exports = module.exports = router
