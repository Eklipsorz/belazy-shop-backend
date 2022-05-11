const {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_ORDER,
  ORDER_OPTIONS
} = require('../config/app').middleware.pageHandler

class ParameterPreprocessor {
  static orderSetter(order) {
    const resultOrder = order.toUpperCase()
    return ORDER_OPTIONS.includes(resultOrder) ? resultOrder : DEFAULT_ORDER
  }

  static paging(req, _, next) {
    let { page, limit, order } = req.query

    page = (!isNaN(page) && Number(page)) || DEFAULT_PAGE
    limit = (!isNaN(limit) && Number(limit)) || DEFAULT_LIMIT
    order = order ? ParameterPreprocessor.orderSetter(order) : DEFAULT_ORDER

    const offset = (page - 1) * limit
    req.query = { ...req.query, page, limit, order, offset }

    return next()
  }
}
exports = module.exports = {
  ParameterPreprocessor
}
