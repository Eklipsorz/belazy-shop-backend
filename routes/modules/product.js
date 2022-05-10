const express = require('express')
const { productController } = require('../../controllers/product')
const { ExistURIValidator } = require('../../middlewares/URI-format-validator')
const { ParameterValidator } = require('../../middlewares/parameter-validator')

// enable/disable paging via adding it
const { paging } = require('../../middlewares/pager')

// enable/disable user authentication via adding it
const { authenticateUser } = require('../../middlewares/authenticator')

const router = express.Router()

const SearchHintsMiddlewares = [
  // add middleware to route (get /products/search/hints)
]

const searchCategoryMiddlewares = [
  // add middleware to route (get /products/categories/search)
  paging,
  ParameterValidator.queryStringValidate
]

const searchProductsMiddlewares = [
  // add middleware to route (get /products/search)
  paging,
  ParameterValidator.queryStringValidate
]

const likeProductMiddleware = [
  // add middleware to route (post /products/:productId/like)
  authenticateUser,
  ExistURIValidator
]

const unlikeProductMiddleware = [
  // add middleware to route (get /products/:productId/unlike)
  authenticateUser,
  ExistURIValidator
]

router.get('/search/hints', ...SearchHintsMiddlewares, productController.getSearchHints)
router.get('/categories/search', ...searchCategoryMiddlewares, productController.searchProductsFromCategory)
router.get('/search', ...searchProductsMiddlewares, productController.searchProducts)

router.post('/:productId/like', ...likeProductMiddleware, productController.likeProduct)
router.post('/:productId/unlike', ...unlikeProductMiddleware, productController.unlikeProduct)

router.get('/:productId', ExistURIValidator, productController.getProduct)
router.get('/', paging, productController.getProducts)

exports = module.exports = router
