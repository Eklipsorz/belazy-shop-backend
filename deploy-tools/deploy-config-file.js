const fs = require('fs')
require('dotenv').config()
const { FileToolKit } = require('../utils/file-tool-kit')
const SSLKEY = process.env.PROD_SSL_DBKEY_PATH
const SSLCERT = process.env.PROD_SSL_DBCERT_PATH
const SSLCA = process.env.PROD_SSL_DBCA_PATH

async function deployDBSSL() {
  const keyContent = await FileToolKit.readRemoteFile(SSLKEY)
  const certContent = await FileToolKit.readRemoteFile(SSLCERT)
  const caContent = await FileToolKit.readRemoteFile(SSLCA)
  fs.writeFileSync(`config/${SSLKEY}`, keyContent)
  fs.writeFileSync(`config/${SSLCERT}`, certContent)
  fs.writeFileSync(`config/${SSLCA}`, caContent)
}

async function main() {
  deployDBSSL()
}

main()
