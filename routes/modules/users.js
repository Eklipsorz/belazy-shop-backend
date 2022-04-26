const express = require('express')
const { userController } = require('../../controllers/user-controller')
const { upload } = require('../../helpers/multer-helper')
const router = express.Router()

router.get('/self', userController.getSelf)
router.put('/self', upload.single('avatar'), userController.putSelf)

exports = module.exports = router
