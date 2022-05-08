const express = require('express')
const { categoryController } = require('../../controllers/category')
const { paging } = require('../../middlewares/pager')
const { ExistURIValidator } = require('../../middlewares/URI-format-validator')
const { authenticateUser } = require('../../middlewares/authenticator')
const router = express.Router()

router.get('/', paging, categoryController.getCategories)
router.get('/products', categoryController.getProductsFromCategories)
router.get('/:categoryId/products', ExistURIValidator, paging, categoryController.getProductsFromCategory)
router.get('/:categoryId', ExistURIValidator, categoryController.getCategory)

exports = module.exports = router
