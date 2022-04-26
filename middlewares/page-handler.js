const {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_ORDER,
  ORDER_OPTIONS
} = require('../config/project').middleware.pageHandler

function orderSetter(order) {
  const resultOrder = order.toUpperCase()
  return ORDER_OPTIONS.includes(resultOrder) ? resultOrder : DEFAULT_ORDER
}

function paging(req, _, next) {
  let { page, limit, order } = req.query

  page = (!isNaN(page) && Number(page)) || DEFAULT_PAGE
  limit = (!isNaN(limit) && Number(limit)) || DEFAULT_LIMIT
  order = order ? orderSetter(order) : DEFAULT_ORDER

  const offset = (page - 1) * limit
  req.query = { page, limit, order, offset }

  return next()
}

exports = module.exports = {
  paging
}
