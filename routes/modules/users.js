const express = require('express')
const { userController } = require('../../controllers/user')
const { upload } = require('../../helpers/file-uploader')
const router = express.Router()

router.get('/self', userController.getSelf)
router.put('/self', upload.single('avatar'), userController.putSelf)

exports = module.exports = router
