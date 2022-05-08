const express = require('express')
const { categoryController } = require('../../controllers/category')
const { paging } = require('../../middlewares/pager')
const { ExistURIValidator } = require('../../middlewares/URI-format-validator')
const router = express.Router()

router.get('/', paging, categoryController.getCategories)
router.get('/:categoryId', ExistURIValidator, categoryController.getCategory)
exports = module.exports = router
