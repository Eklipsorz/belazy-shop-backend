const express = require('express')
const categoryController = require('../../controllers/category')
const router = express.Router()

router.get('/:categoryId', categoryController.getCategory)
exports = module.exports = router
