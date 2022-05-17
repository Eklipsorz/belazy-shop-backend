const { ParameterValidator } = require('../middlewares/parameter-validator')

// enable/disable user authentication via adding it
const { AuthValidator } = require('../middlewares/auth-validator')
// enable/disable paging via adding it
const { ParameterPreprocessor } = require('../middlewares/parameter-preprocessor')
const { FileUploader } = require('../middlewares/file-uploader')
// enable/disable file upload via adding it
const upload = FileUploader.getMulter()

const generalMiddleware = {
  all: [
    AuthValidator.authenticate
  ],
  // add middleware to route (All methods to /users)
  users: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser
  ],
  // add middleware to route (POST /users)
  userRegister: [],
  // add middleware to route (POST /users/login)
  userLogin: [],
  // add middleware to route (All methods to /admin)
  admin: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateAdmin
  ],
  // add middleware to route (POST /admin/login)
  adminLogin: [],
  // add middleware to route (All methods to /categories)
  categories: [],
  // add midddleware to route (All methods to /products)
  products: [],
  // add middleware to route (All methods to /replies)
  replies: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser
  ]
}

const userMiddleware = {
  // add middleware to route (GET /users/self)
  getSelf: [],
  // add middleware to route (PUT /users/self)
  putSelf: [
    upload.single('avatar')
  ]
}

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
    ParameterPreprocessor.paging
  ],
  // add middleware to route (GET /admin/categories/:categoryId)
  getCategory: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /admin/categories)
  getCategories: [
    ParameterPreprocessor.paging
  ],
  // add middleware to route (GET /admin/products/:productId)
  getProduct: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /admin/products)
  getProducts: [
    ParameterPreprocessor.paging
  ]
}

const productMiddleware = {
  // add middleware to route (GET /products/search/hints)
  searchHints: [],
  // add middleware to route (GET /products/categories/search)
  searchCategory: [
    ParameterPreprocessor.paging,
    ParameterValidator.searchParameterValidate
  ],
  // add middleware to route (GET /products/search)
  searchProduct: [
    ParameterPreprocessor.paging,
    ParameterValidator.searchParameterValidate
  ],
  // add middleware to route (POST /products/:productId/like)
  likeProduct: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /products/:productId/unlike)
  unlikeProduct: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /products)
  getProducts: [
    ParameterPreprocessor.paging
  ],
  // add middleware to route (GET /products/:productId)
  getProduct: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /products/:productId/replies)
  getReplies: [
    ParameterValidator.ExistURIValidate,
    ParameterPreprocessor.paging
  ],

  // add middleware to route (POST /products/:productId/replies)
  postReplies: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.ExistURIValidate
  ]

}

const categoryMiddleware = {

  // add middleware to route (GET /categories)
  getCategories: [
    ParameterPreprocessor.paging
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
    ParameterPreprocessor.paging
  ]
}

const replyMiddleware = {
  // add middleware to route (DELETE /replies/:replyId)
  deleteReply: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (PUT /replies/:replyId)
  putReply: [
    ParameterValidator.ExistURIValidate
  ],
  // add middleware to route (GET /replies/:replyId)
  getReply: [
    ParameterValidator.ExistURIValidate
  ]
}

exports = module.exports = {
  generalMiddleware,
  adminMiddleware,
  userMiddleware,
  replyMiddleware,
  productMiddleware,
  categoryMiddleware
}
