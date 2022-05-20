const { APIError } = require('../../helpers/api-error')
const { status, code } = require('../../config/result-status-table').errorTable

class CartResource {
  static async postCarts(req) {
    console.log('post Carts')
  }
}

exports = module.exports = {
  CartResource
}
