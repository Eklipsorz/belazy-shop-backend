const { productController } = require('../../controllers/product')
const { productMiddleware } = require('../../config/route')
const express = require('express')
const router = express.Router()

const controller = productController
const middleware = productMiddleware

router.get('/search/hints', ...middleware.searchHints, controller.getSearchHints)
router.get('/categories/search', ...middleware.searchCategory, controller.searchProductsFromCategory)
router.get('/search', ...middleware.searchProduct, controller.searchProducts)

router.get('/:productId/snapshot', ...middleware.getProductSnapshot, controller.getProductSnapshot)
router.get('/:productId/stock', ...middleware.getStock, controller.getStock)

router.get('/:productId/replies', ...middleware.getReplies, controller.getReplies)
router.post('/:productId/replies', ...middleware.postReplies, controller.postReplies)
// router.use('/', (req, res, next) => {
//   console.log('post /')
// })
// router.post('/:productId/like', (req, res, next) => {
//   console.log('hi')
//   return next()
// })
router.post('/:productId/like', ...middleware.likeProduct, controller.likeProduct)
router.post('/:productId/unlike', ...middleware.unlikeProduct, controller.unlikeProduct)

router.get('/:productId', ...middleware.getProduct, controller.getProduct)
router.get('/', ...middleware.getProducts, controller.getProducts)

exports = module.exports = router
