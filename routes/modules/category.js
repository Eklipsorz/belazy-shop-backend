const express = require('express')
const { categoryController } = require('../../controllers/category')
const { paging } = require('../../middlewares/pager')
const router = express.Router()

router.get('/', paging, categoryController.getCategories)
router.get('/:categoryId', categoryController.getCategory)
exports = module.exports = router
