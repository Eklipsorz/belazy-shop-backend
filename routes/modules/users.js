const express = require('express')
const { userController } = require('../../controllers/user')
const { FileUploadToolKit } = require('../../utils/file-upload-tool-kit')
const upload = FileUploadToolKit.getMulter()
const router = express.Router()

router.get('/self', userController.getSelf)
router.put('/self', upload.single('avatar'), userController.putSelf)

exports = module.exports = router
