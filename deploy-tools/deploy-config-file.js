const fs = require('fs')

const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { FileToolKit } = require('../utils/file-tool-kit')

const {
  DB_SSLKEY, DB_SSLCERT, DB_SSLCA, CREDENTIALS
} = require('../config/env').ENV

async function deployDBSSL() {
  const keyContent = await FileToolKit.readRemoteFile(DB_SSLKEY)
  const certContent = await FileToolKit.readRemoteFile(DB_SSLCERT)
  const caContent = await FileToolKit.readRemoteFile(DB_SSLCA)
  fs.writeFileSync(`config/${DB_SSLKEY}`, keyContent)
  fs.writeFileSync(`config/${DB_SSLCERT}`, certContent)
  fs.writeFileSync(`config/${DB_SSLCA}`, caContent)
}

async function deployCredentials() {
  const credentialContent = await FileToolKit.readRemoteFile(CREDENTIALS)
  fs.writeFileSync(`config/${CREDENTIALS}`, credentialContent)
}

async function main() {
  await deployDBSSL()
  // deployCredentials()
}

main()
