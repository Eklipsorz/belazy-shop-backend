
const { APIError } = require('../helpers/api-error')
const { status, code } = require('../config/result-status-table').errorTable

const { Storage } = require('@google-cloud/storage')

const PROD_GCLOUD_STORAGE_BUCKET = process.env.PROD_STORAGE_CONFIG_BUCKET
const storage = new Storage()
const bucket = storage.bucket(PROD_GCLOUD_STORAGE_BUCKET)

class FileHandler {
  static readCloudStorageFile(filepath) {
    return new Promise((resolve, reject) => {
      const chunks = []
      const blob = bucket.file(filepath)
      const readStream = blob.createReadStream()
      readStream.on('error', (error) => reject(error))
      readStream.on('end', () => resolve(chunks))
      readStream.on('data', chunk => { chunks.push(chunk) })
    })
  }

  static async readRemoteFile(file, destType = 'cloudStorage') {
    try {
      let result = ''
      switch (destType) {
        case 'cloudStorage':
          result = await FileHandler.readCloudStorageFile(file)
          break
      }
      const fileContent = result.reduce((prev, cur) => Buffer.concat([prev, cur]))
      return fileContent
    } catch (error) {
      throw new APIError({ code: code.SERVERERROR, status, error: error.message })
    }
  }
}
// async function main() {
//   const result = await FileHandler.readRemoteFile('db-ssl/client-key.pem')
//   console.log(result)
// }
// main()

exports = module.exports = {
  FileHandler
}
