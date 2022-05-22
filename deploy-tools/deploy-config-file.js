const fs = require('fs')
require('dotenv').config()
const { FileHandler } = require('../utils/file-handler')

async function main() {
  const keyContent = await FileHandler.readRemoteFile('db-ssl/client-key.pem')
  const certContent = await FileHandler.readRemoteFile('db-ssl/client-cert.pem')
  const caContent = await FileHandler.readRemoteFile('db-ssl/server-ca.pem')
  fs.writeFileSync('config/ssl/db/client-key.pem', keyContent)
  fs.writeFileSync('config/ssl/db/client-cert.pem', certContent)
  fs.writeFileSync('config/ssl/db/server-ca.pem', caContent)
}

main()
