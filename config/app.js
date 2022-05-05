require('dotenv').config()

const { status, code } = require('./result-status-table').errorTable

/* general config */
const generalConfig = {
  blackListRoleIn: {
    user: ['admin'],
    admin: ['user']
  },
  tokenExpiresIn: {
    accessToken: '1200s',
    refreshToken: '3600s'
  },
  DEFAULT_TALLY: {
    LIKED: 5,
    REPLIED: 5
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
  },
  userService: {
    SEARCH_HINT_NUMBER: 10
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
/* helper config */
const helper = {
  fileUploader: {
    MAXFILESIZE: 5 * 1024 * 1024,
    DEFAULT_AVATAR: 'https://res.cloudinary.com/dqfxgtyoi/image/upload/v1650818850/belazy-shop/Avatar_n1jfi9.png'
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
      MAX: generalConfig.DEFAULT_TALLY.LIKED,
      CURRENT: generalConfig.DEFAULT_TALLY.LIKED
    }
  },
  repliesSeeder: {
    DEFAULT_OPTIONS_NUMBER: {
      MIN: 0,
      MAX: generalConfig.DEFAULT_TALLY.REPLIED,
      CURRENT: generalConfig.DEFAULT_TALLY.REPLIED
    }
  },
  stockSeeder: {
    DEFAULT_QUANTITY: {
      // 產品總數
      SUM: 100,
      // 剩餘能賣的數量
      REST: 50
    }
  },
  productStatisticsSeeder: {
    DEFAULT_TALLY: {
      LIKED: generalConfig.DEFAULT_TALLY.LIKED,
      RELIED: generalConfig.DEFAULT_TALLY.REPLIED
    }
  }
}

exports = module.exports = {
  // controller,
  helper,
  service,
  generalConfig,
  middleware,
  seeder

}
