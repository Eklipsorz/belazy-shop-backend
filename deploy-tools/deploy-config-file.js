const fs = require('fs')

const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { FileToolKit } = require('../utils/file-tool-kit')

const { SSLKEY, SSLCERT, SSLCA, CREDENTIALS } = require('../config/env').ENV

async function deployDBSSL() {
  const keyContent = await FileToolKit.readRemoteFile(SSLKEY)
  const certContent = await FileToolKit.readRemoteFile(SSLCERT)
  const caContent = await FileToolKit.readRemoteFile(SSLCA)
  fs.writeFileSync(`config/${SSLKEY}`, keyContent)
  fs.writeFileSync(`config/${SSLCERT}`, certContent)
  fs.writeFileSync(`config/${SSLCA}`, caContent)
}

async function deployCredentials() {
  const credentialContent = await FileToolKit.readRemoteFile(CREDENTIALS)
  fs.writeFileSync(`config/${CREDENTIALS}`, credentialContent)
}

async function main() {
  deployDBSSL()
  // deployCredentials()
}

main()
