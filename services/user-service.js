const { APIError } = require('../helpers/api-error-helper')

const userServices = {
  login: async (req, cb) => {
    const { account, password } = req.body

    try {
      if (!account || !password) {
        cb(new APIError({ code: 403, status: 'error', message: '未填寫完所有欄位', data: null }))
      }
    } catch (error) {
      cb(error)
    }
  }
}

exports = module.exports = {
  userServices
}
