const { ParameterValidator } = require('../middlewares/parameter-validator')

// enable/disable paging via adding it
const { paging } = require('../middlewares/pager')

// enable/disable user authentication via adding it
const { authenticateUser } = require('../middlewares/authenticator')

const productMiddleware = {
  // add middleware to route (get /products/search/hints)
  searchHints: [],
  // add middleware to route (get /products/categories/search)
  searchCategory: [
    paging,
    ParameterValidator.searchParameterValidate
  ],
  // add middleware to route (get /products/search)
  searchProduct: [
    paging,
    ParameterValidator.searchParameterValidate
  ],
  // add middleware to route (post /products/:productId/like)
  likeProduct: [
    authenticateUser,
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (get /products/:productId/unlike)
  unlikeProduct: [
    authenticateUser,
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (get /products)
  getProducts: [
    paging
  ],
  // add middleware to route (get /products/:productId)
  getProduct: [
    ParameterValidator.ExistURIValidate
  ]
}

exports = module.exports = {
  productMiddleware
}
