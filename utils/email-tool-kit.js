const { project } = require('../config/project')
require('dotenv').config({ path: project.ENV })

const { RESET_PASSWORD_EMAIL, RESET_PASSWORD_URL } = require('../config/app').generalConfig.CONTACT

const sendGridMail = require('@sendgrid/mail')
sendGridMail.setApiKey(process.env.SENDGRID_APIKEY)

class EmailToolKit {
  static async sendSupportEmail({ req, receiver, subject, token }) {
    const supportFrom = RESET_PASSWORD_EMAIL
    const scheme = req.protocol
    const host = req.headers.host
    const supportURL = `${scheme}://${host}/${RESET_PASSWORD_URL}`

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
}

exports = module.exports = {
  EmailToolKit
}
