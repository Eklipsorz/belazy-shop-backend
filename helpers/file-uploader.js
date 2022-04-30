const { ImgurClient } = require('imgur')
const { code } = require('../config/result-status-table').successTable
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const { createReadStream } = require('fs')
const client = new ImgurClient({ clientId: IMGUR_CLIENT_ID })

const multer = require('multer')
const upload = multer({ dest: 'temp/' })

async function ImgurFileHandler(file) {
  try {
    const response = await client.upload({
      image: createReadStream(file.path),
      type: 'stream'
    })

    const result = response
    return result.status === code.OK
      ? result.data.link
      : 'https://res.cloudinary.com/dqfxgtyoi/image/upload/v1650818850/belazy-shop/Avatar_n1jfi9.png'
  } catch (_) {
    return 'https://res.cloudinary.com/dqfxgtyoi/image/upload/v1650818850/belazy-shop/Avatar_n1jfi9.png'
  }
}

exports = module.exports = {
  upload,
  ImgurFileHandler
}
