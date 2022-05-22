const { Storage } = require('@google-cloud/storage')
const { format } = require('util')
const { DEFAULT_AVATAR, MAXFILESIZE } = require('../config/app').utility.FileUploadToolKit
const multer = require('multer')

require('dotenv').config()
const PROD_GCLOUD_STORAGE_BUCKET = process.env.PROD_GCLOUD_STORAGE_BUCKET
console.log('PROD_GCLOUD_STORAGE_BUCKET', process.env.PROD_GCLOUD_STORAGE_BUCKET)
const storage = new Storage()
const bucket = storage.bucket(PROD_GCLOUD_STORAGE_BUCKET)

class FileUploader {
  static cloudStorageHandler(file) {
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

  static async upload(file, destType = 'cloudStorage') {
    try {
      let resultURL = ''
      switch (destType) {
        case 'cloudStorage':
          resultURL = await FileUploader.cloudStorageHandler(file)
          break
      }

      return resultURL
    } catch (_) {
      return DEFAULT_AVATAR
    }
  }

  static getMulter() {
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: MAXFILESIZE
      }
    })
    return upload
  }
}

exports = module.exports = {
  FileUploader
}
