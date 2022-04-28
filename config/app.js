// If this is called standby, then load env variable with dotenv
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const { status, code } = require('./result-status-table').errorTable

/* general config */
const generalConfig = {
  blackListRoleIn: {
    user: ['admin'],
    admin: ['user']
  },
  tokenExpiresIn: {
    accessToken: '600s',
    refreshToken: '3600s'
  }
}

/* controller config */
// const controller = {
//   userController: {

//   },
//   adminController: {

//   }
// }

/* service config */
const service = {
  accountService: {
    DEFAULT_BCRYPT_COMPLEXITY: 10,
    DEL_OPERATION_CODE: '-1'
  }
  // userService: {

  // },
  // adminService: {

  // }
}

/* middleware config */
const middleware = {
  APIErrorHandler: {
    DEFAULT_STATUS: status,
    DEFAULT_CODE: code.SERVERERROR,
    DEFAULT_MESSAGE: '系統出錯',
    DEFAULT_DATA: null
  },
  pageHandler: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    DEFAULT_ORDER: 'DESC',
    ORDER_OPTIONS: ['DESC', 'ASC']
  }
}

/* seeder config */
const seeder = {
  usersSeeder: {
    // 設定每位使用者的預設密碼(含root)
    DEFAULT_PASSWORD: '12345678',
    // 設定Bcrypt 雜湊複雜度
    DEFAULT_BCRYPT_COMPLEXITY: 10,
    // 設定使用者預設數量
    DEFAULT_USER_NUMBER: 20,
    DEFAULT_EMAIL_PREFIX: process.env.SEEDER_EMAIL_PREFIX || 'user',
    DEFAULT_EMAIL_SUFFIX: process.env.SEEDER_EMAIL_SUFFIX || 'example.com'
  },
  categoriesSeeder: {
    DEFAULT_CATEGORY_NUMBER: 8,
    DEFAULT_CATEGORY: [
      { name: 'snack', image: 'fa-solid fa-cookie' },
      { name: 'computer', image: 'fa-solid fa-computer' },
      { name: 'furniture', image: 'fa-solid fa-couch' },
      { name: 'stationery', image: 'fa-solid fa-pen-ruler' },
      { name: 'kitchenware', image: 'fa-solid fa-kitchen-set' },
      { name: 'book', image: 'fa-solid fa-books' },
      { name: 'clothing', image: 'fa-solid fa-shirt' },
      { name: 'lamp', image: 'fa-solid fa-lamp' }
    ]

  },
  productsSeeder: {
    DEFAULT_PRODUCT_NUMBER: 100,
    DEFEAULT_PRICE: {
      MIN: 100,
      MAX: 1000
    }
  },
  ownershipsSeeder: {
    // 每一個產品能選的種類數，預設為1~3個
    DEFAULT_OPTIONS_NUMBER: {
      MIN: 1,
      MAX: 3,
      CURRENT: 3
    }
  },
  likesSeeder: {
    DEFAULT_OPTIONS_NUMBER: {
      MIN: 0,
      MAX: 5,
      CURRENT: 5
    }
  },
  repliesSeeder: {
    DEFAULT_OPTIONS_NUMBER: {
      MIN: 0,
      MAX: 5,
      CURRENT: 5
    }
  },
  stockSeeder: {
    DEFAULT_QUANTITY: {
      // 產品總數
      SUM: 100,
      // 剩餘能賣的數量
      REST: 50
    }
  }
}

exports = module.exports = {
  // controller,
  service,
  generalConfig,
  middleware,
  seeder

}
