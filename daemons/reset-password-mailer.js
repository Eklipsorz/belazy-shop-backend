const { workerData } = require('worker_threads')
const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { RESET_PASSWORD_EMAIL, RESET_PASSWORD_URL } = require('../config/app').generalConfig.CONTACT
const { SENDGRID_APIKEY } = require('../config/env').ENV
console.log('thread', workerData)
const NODE_ENV = workerData.NODE_ENV
const redisConfig = require('../config/redis')[NODE_ENV]
const createRedisClient = require('../db/redis')
const redisClient = createRedisClient(redisConfig)
const sendGridMail = require('@sendgrid/mail')

sendGridMail.setApiKey(SENDGRID_APIKEY)

redisClient.subscribe('reset-password', (error, count) => {
  if (error) {
    // Just like other commands, subscribe() can fail for some reasons,
    // ex network issues.
    console.error('Failed to subscribe: %s', error.message)
  } else {
    // `count` represents the number of channels this client are currently subscribed to.
    console.log(
      `Subscribed successfully! This client is currently subscribed to ${count} channels.`
    )
  }
})

redisClient.on('message', async (channel, message) => {
  const data = JSON.parse(message)

  await sendSupportEmail(data)
})

async function sendSupportEmail({ req, receiver, subject, token }) {
  const supportFrom = RESET_PASSWORD_EMAIL
  const host = req.host
  const scheme = req.scheme
  const supportURL = `${scheme}://${host}/${RESET_PASSWORD_URL}`

  token = encodeURIComponent(token)

  const template = {
    from: supportFrom,
    to: receiver.email,
    subject,
    text: `${receiver.account}您好，我們已經收到您重設密碼的申請，請點擊連結，將會為您的帳
            戶重新設置新密碼，或是複製以下連結至您的瀏覽器開啟${supportURL}/?token=${token}`,
    html: `${receiver.account}您好，我們已經收到您重設密碼的申請，請點擊連結，將會為您的帳戶重
            新設置新密碼，或是複製以下連結至您的瀏覽器開啟
            <a href="${supportURL}/?token=${token}">${supportURL}?token=${token} </a>`
  }

  return await sendGridMail.send(template)
}
