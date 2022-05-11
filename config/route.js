const { ParameterValidator } = require('../middlewares/parameter-validator')

// enable/disable paging via adding it
const { paging } = require('../middlewares/pager')

// enable/disable user authentication via adding it
const { AuthValidator } = require('../middlewares/auth-validator')

const generalMiddleware = {
  // add middleware to route (All methods to /users)
  users: [
    AuthValidator.authenticate,
    AuthValidator.authenticateUser
  ],
  // add middleware to route (POST /users)
  userRegister: [],
  // add middleware to route (POST /users/login)
  userLogin: [],
  // add middleware to route (All methods to /admin)
  admin: [
    AuthValidator.authenticate,
    AuthValidator.authenticateAdmin
  ],
  // add middleware to route (POST /admin/login)
  adminLogin: [],
  // add middleware to route (All methods to /categories)
  categories: [],
  // add midddleware to route (All methods to /products)
  products: []
}

// router.use('/categories', categoryRoutes)
// router.use('/products', productRoutes)
// router.use('/users', authenticate, authenticateUser, userRoutes)
// router.use('/admin', authenticate, authenticateAdmin, adminRoutes)

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
    AuthValidator.authenticate,
    AuthValidator.authenticateUser,
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /products/:productId/unlike)
  unlikeProduct: [
    AuthValidator.authenticate,
    AuthValidator.authenticateUser,
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
  generalMiddleware,
  adminMiddleware,
  productMiddleware,
  categoryMiddleware
}
