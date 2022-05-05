const { Storage } = require('@google-cloud/storage')
const { format } = require('util')
const { fileUploader } = require('../config/app').helper
const multer = require('multer')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: fileUploader.MAXFILESIZE
  }
})

const PROD_GCLOUD_STORAGE_BUCKET = process.env.PROD_GCLOUD_STORAGE_BUCKET
const storage = new Storage()
const bucket = storage.bucket(PROD_GCLOUD_STORAGE_BUCKET)

function cloudStorageHandler(file) {
  return new Promise((resolve, reject) => {
    const blob = bucket.file(file.originalname)
    const blobStream = blob.createWriteStream({ resumable: false })
    blobStream.on('error', err => reject(err))
    blobStream.on('finish', () => {
      const dirname = bucket.name
      const filename = encodeURI(blob.name)
      const publicURL = format(
        `https://storage.googleapis.com/${dirname}/${filename}`
      )
      return resolve(publicURL)
    })
    blobStream.end(file.buffer)
  })
}

async function fileUpload(file) {
  try {
    const resultURL = await cloudStorageHandler(file)
    return resultURL
  } catch (_) {
    return fileUploader.DEFAULT_AVATAR
  }
}

exports = module.exports = {
  upload,
  fileUpload
}
