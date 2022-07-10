const { ParameterValidator } = require('../middlewares/parameter-validator')

// enable/disable user authentication via adding it
const { AuthValidator } = require('../middlewares/auth-validator')
// enable/disable paging via adding it
const { ParameterPreprocessor } = require('../middlewares/parameter-preprocessor')
const { FileUploader } = require('../middlewares/file-uploader')
// enable/disable file upload via adding it
const upload = FileUploader.getMulter()

const { CartPreprocessor } = require('../middlewares/cart-preprocessor')
const { CartPostprocessor } = require('../middlewares/cart-postprocessor')

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
  // add middleware to route (POST /users/forgot-password)
  postForgotPassword: [],
  // add middleware to route (GET /users/reset-password)
  getResetPassword: [],
  // add middleware to route (POST /users/reset-password)
  postResetPassword: [],
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
  replies: [],
  // add middleware to route (All methods to /carts)
  carts: [
    CartPreprocessor.getSession,
    CartPreprocessor.loginSyncCart,
    CartPreprocessor.syncExpireAt
  ],
  // add middleware to route (All methods to /orders)
  orders: [
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

  // add middleware to route (POST /admin/products)
  postProducts: [
    upload.single('image')
  ],
  // add middleware to route (PUT /admin/products/:productId)
  putProducts: [
    ParameterValidator.existURIValidate,
    upload.single('image')
  ],
  // add middleware to route (DELETE /admin/products/:productId)
  deleteProducts: [
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /admin/categories/:categoryId/products)
  getProductsFromCategory: [
    ParameterValidator.existURIValidate,
    ParameterPreprocessor.paging
  ],
  // add middleware to route (GET /admin/categories/:categoryId)
  getCategory: [
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /admin/categories)
  getCategories: [
    ParameterPreprocessor.paging
  ],
  // add middleware to route (GET /admin/products/:productId)
  getProduct: [
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /admin/products/:productId/stock)
  getStock: [
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (PUT /admin/products/:productId/stock)
  putStack: [
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /admin/products)
  getProducts: [
    ParameterPreprocessor.paging
  ],
  // add middleware to route (POST /admin/orders)
  postOrders: [],
  // add middleware to route (GET /admin/orders)
  getOrders: [
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
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /products/:productId/unlike)
  unlikeProduct: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /products)
  getProducts: [
    ParameterPreprocessor.paging
  ],
  // add middleware to route (GET /products/:productId)
  getProduct: [
    ParameterValidator.existURIValidate
  ],

  // add middleware to route (GET /products/:productId/snapshot)
  getProductSnapshot: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /products/:proudctId/stock)
  getStock: [
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /products/:productId/replies)
  getReplies: [
    ParameterValidator.existURIValidate,
    ParameterPreprocessor.paging
  ],

  // add middleware to route (POST /products/:productId/replies)
  postReplies: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (POST /products/purchase)
  postPagePurchase: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser
  ]
}

const categoryMiddleware = {

  // add middleware to route (GET /categories)
  getCategories: [
    ParameterPreprocessor.paging
  ],
  // add middleware to route (GET /category/:categoryId)
  getCategory: [
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /categories/products)
  getProductsFromCategories: [

  ],
  // add middleware to route (GET /categories/:categoryId/products)
  getProductsFromCategory: [
    ParameterValidator.existURIValidate,
    ParameterPreprocessor.paging
  ]
}

const replyMiddleware = {
  // add middleware to route (DELETE /replies/:replyId)
  deleteReply: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (PUT /replies/:replyId)
  putReply: [
    AuthValidator.authenticateLoggedIn,
    AuthValidator.authenticateUser,
    ParameterValidator.existURIValidate
  ],
  // add middleware to route (GET /replies/:replyId)
  getReply: [
    ParameterValidator.existURIValidate
  ]
}

const orderMiddleware = {
  // add middleware to route (POST /orders)
  postOrders: [],
  // add middleware to route (POST /orders)
  getOrders: [
    ParameterPreprocessor.paging
  ]
}

const cartMiddleware = {

  preprocessor: {
    // add middleware to route (GET /carts/self)
    getCart: [
      AuthValidator.authenticateLoggedIn,
      AuthValidator.authenticateUser
    ],
    // add middleware to route (GET /carts/self/items)
    getCartItems: [
      AuthValidator.authenticateLoggedIn,
      AuthValidator.authenticateUser
    ],
    // add middleware to route (POST /carts/self/items)
    postCartItems: [],
    // add middleware to route (PUT /carts/self)
    putCartItems: [
      AuthValidator.authenticateLoggedIn,
      AuthValidator.authenticateUser
    ],
    // add middleware to route (DELETE /carts/self/items)
    deleteCartItem: [
      AuthValidator.authenticateLoggedIn,
      AuthValidator.authenticateUser
    ],
    // add middleware to route (DELETE /carts/self)
    deleteCart: [
      AuthValidator.authenticateLoggedIn,
      AuthValidator.authenticateUser
    ],
    // add middleware to route (POST /cart/self/purchase)
    postCartPurchase: [
      AuthValidator.authenticateLoggedIn,
      AuthValidator.authenticateUser
    ]
  },
  postprocessor: {
    // add middleware to route (GET /carts/self)
    getCart: [
      CartPostprocessor.checkAndSyncDB
    ],
    // add middleware to route (GET /carts/self/items)
    getCartItems: [
      CartPostprocessor.checkAndSyncDB
    ],
    // add middleware to route (POST /carts/self/items)
    postCartItems: [
      CartPostprocessor.checkAndSyncDB
    ],
    // add middleware to route (PUT /carts/self)
    putCartItems: [
      CartPostprocessor.checkAndSyncDB
    ],
    // add middleware to route (DELETE /carts/self/items)
    deleteCartItem: [
      CartPostprocessor.checkAndSyncDB
    ],
    // add middleware to route (DELETE /carts/self)
    deleteCart: [
      CartPostprocessor.checkAndSyncDB
    ],
    // add middleware to route (POST /cart/self/purchase)
    postCartPurchase: [
      CartPostprocessor.checkAndSyncDB
    ]
  }

}

exports = module.exports = {
  generalMiddleware,
  adminMiddleware,
  userMiddleware,
  replyMiddleware,
  cartMiddleware,
  productMiddleware,
  categoryMiddleware,
  orderMiddleware
}
