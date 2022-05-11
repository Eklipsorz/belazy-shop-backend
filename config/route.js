const { ParameterValidator } = require('../middlewares/parameter-validator')

// enable/disable paging via adding it
const { paging } = require('../middlewares/pager')

// enable/disable user authentication via adding it
const { authenticateUser } = require('../middlewares/authenticator')

const adminMiddleware = {
  // add middleware to route (GET /admin/getSelf)
  getSelf: [],
  // add middleware to route (PUT /admin/getSelf)
  putSelf: [],
  // add middleware to route (GET /admin/categories/products)
  getProductsFromCategories: [],
  // add middleware to route (GET /admin/categories/:categoryId/products)
  getProductsFromCategory: [
    ParameterValidator.ExistURIValidate,
    paging
  ],
  // add middleware to route (GET /admin/categories/:categoryId)
  getCategory: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /admin/categories)
  getCategories: [
    paging
  ],
  // add middleware to route (GET /admin/products/:productId)
  getProduct: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /admin/products)
  getProducts: [
    paging
  ]
}
// router.get('/self', adminController.getSelf)
// router.put('/self', adminController.putSelf)

// router.get('/categories/products', adminController.getProductsFromCategories)
// router.get('/categories/:categoryId/products', ExistURIValidator, paging, adminController.getProductsFromCategory)
// router.get('/categories/:categoryId', ExistURIValidator, adminController.getCategory)
// router.get('/categories', paging, adminController.getCategories)

// router.get('/products/:productId', adminController.getProduct)
// router.get('/products', paging, adminController.getProducts)

const productMiddleware = {
  // add middleware to route (GET /products/search/hints)
  searchHints: [],
  // add middleware to route (GET /products/categories/search)
  searchCategory: [
    paging,
    ParameterValidator.searchParameterValidate
  ],
  // add middleware to route (GET /products/search)
  searchProduct: [
    paging,
    ParameterValidator.searchParameterValidate
  ],
  // add middleware to route (POST /products/:productId/like)
  likeProduct: [
    authenticateUser,
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /products/:productId/unlike)
  unlikeProduct: [
    authenticateUser,
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /products)
  getProducts: [
    paging
  ],
  // add middleware to route (GET /products/:productId)
  getProduct: [
    ParameterValidator.ExistURIValidate
  ]
}

const categoryMiddleware = {

  // add middleware to route (GET /categories)
  getCategories: [
    paging
  ],
  // add middleware to route (GET /category/:categoryId)
  getCategory: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /categories/products)
  getProductsFromCategories: [

  ],
  // add middleware to route (GET /categories/:categoryId/products)
  getProductsFromCategory: [
    ParameterValidator.ExistURIValidate,
    paging
  ]
}

exports = module.exports = {
  adminMiddleware,
  productMiddleware,
  categoryMiddleware
}
