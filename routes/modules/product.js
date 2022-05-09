const express = require('express')
const { productController } = require('../../controllers/product')
const { ExistURIValidator } = require('../../middlewares/URI-format-validator')
const { ParameterValidator } = require('../../middlewares/parameter-validator')

const { paging } = require('../../middlewares/pager')
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
  paging
]

router.get('/search/hints', ...SearchHintsMiddlewares, productController.getSearchHints)
router.get('/categories/search', ...searchCategoryMiddlewares, productController.searchProductsFromCategory)
router.get('/search', ...searchProductsMiddlewares, productController.searchProducts)

router.get('/:productId', ExistURIValidator, productController.getProduct)
router.get('/', paging, productController.getProducts)

exports = module.exports = router
