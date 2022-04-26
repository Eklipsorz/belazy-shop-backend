const { ImgurClient } = require('imgur')
const { code } = require('../config/result-status-table').successTable
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const { createReadStream } = require('fs')
const client = new ImgurClient({ clientId: IMGUR_CLIENT_ID })

async function ImgurFileHandler(file) {
  try {
    const response = await client.upload({
      image: createReadStream(file.path),
      type: 'stream'
    })

    const result = response
    return result.status === code.OK ? result.data.link : null
  } catch (_) {
    return null
  }
}

exports = module.exports = {
  ImgurFileHandler
}
