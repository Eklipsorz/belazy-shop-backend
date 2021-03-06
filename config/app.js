const { project } = require('./project')
require('dotenv').config({ path: project.ENV })

const { ENV } = require('./env')
const { status, code } = require('./result-status-table').errorTable

/* general config */
const generalConfig = {
  blackListRoleIn: {
    user: ['admin'],
    admin: ['user']
  },
  tokenExpiresIn: {
    accessToken: '3600s',
    refreshToken: '3600s'
  },
  DEFAULT_TALLY: {
    LIKED: 5,
    REPLIED: 5
  },
  CONTACT: {
    RESET_PASSWORD_EMAIL: 'support@belazy.shop',
    RESET_PASSWORD_URL: 'users/reset-password'
  }
}
const cache = {
  CART: {
    PREFIX_CART_KEY: 'cart',
    PREFIX_CARTITEM_KEY: 'cart_item'
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
    DEL_OPERATION_CODE: '-1',
    DEFAULT_AVATAR: 'https://res.cloudinary.com/dqfxgtyoi/image/upload/v1650818850/belazy-shop/Avatar_n1jfi9.png',
    RESEND_KEY_PREFIX: 'resend',
    RESETPWD_KEY_PREFIX: 'resetPWD',
    RESET_TOKEN_LENGTH: 128,
    RESEND_TIME_LIMIT: 60,
    RESET_PASSWORD_TIME_LIMIT: 600
  },
  userService: {
    SEARCH_HINT_NUMBER: 10,
    AVABILABLE_BY_OPTION: ['relevancy', 'accuracy']
  },
  searchResource: {

  },
  replyResource: {
    MIN_LENGTH_CONTENT: 1,
    MAX_LENGTH_CONTENT: 255
  },
  productResource: {
    MIN_LENGTH_NAME: 1,
    MAX_LENGTH_NAME: 30,
    DEL_OPERATION_CODE: '-1',
    DEFAULT_PRODUCT_IMAGE: 'https://res.cloudinary.com/dqfxgtyoi/image/upload/v1656075982/belazy-shop/coming-soon-product_v7e8p7.png'
  },

  redisLock: {
    DEFAULT_LOCKNAME: 'lock',
    DEFAULT_LOCKTIME: 5000,
    DEFAULT_TIMEOUT: 15000,
    DEFAULT_EXPIRY_MODE: 'PX',
    DEFAULT_SET_MODE: 'NX',
    // in ms
    DEFAULT_SLEEP_PERIOD: 200,
    DEFAULT_REFRESH_PERIOD: 2500
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
    DEFAULT_MESSAGE: '????????????',
    DEFAULT_DATA: null
  },
  pageHandler: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    DEFAULT_ORDER: 'DESC',
    ORDER_OPTIONS: ['DESC', 'ASC']
  },
  parameterValidator: {
    AVABILABLE_BY_OPTION: ['relevancy', 'accuracy']
  }
}
/* helper config */
// const helper = {

// }

/* utility config */
const utility = {
  FileUploadToolKit: {
    MAXFILESIZE: 5 * 1024 * 1024,
    DEFAULT_AVATAR: 'https://res.cloudinary.com/dqfxgtyoi/image/upload/v1650818850/belazy-shop/Avatar_n1jfi9.png'
  },
  RedisToolKit: {
    REFRESHAT: {
      cart: {
        BASEDAYS: 1,
        // Minute range
        MINRANGE: {
          MIN: 360,
          MAX: 1440
        }
      },
      cart_item: {
        BASEDAYS: 1,
        // Minute range
        MINRANGE: {
          MIN: 360,
          MAX: 1440
        }
      },
      stock: {
        BASEDAYS: 1,
        // Minute range
        MINRANGE: {
          MIN: 360,
          MAX: 1440
        }
      },
      product: {
        BASEDAYS: 2,
        // Minute range
        MINRANGE: {
          MIN: 360,
          MAX: 1440
        }
      }
    },
    ONLYREAD_KEYTYPE: [
      'product'
    ]
  }
}

/* seeder config */
const seeder = {
  usersSeeder: {
    // ????????????????????????????????????(???root)
    DEFAULT_PASSWORD: '12345678',
    // ??????Bcrypt ???????????????
    DEFAULT_BCRYPT_COMPLEXITY: 10,
    // ???????????????????????????
    DEFAULT_USER_NUMBER: 20,
    DEFAULT_EMAIL_PREFIX: ENV?.SEEDER_EMAIL_PREFIX || 'user',
    DEFAULT_EMAIL_SUFFIX: ENV?.SEEDER_EMAIL_SUFFIX || 'example.com'
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
    DEFAULT_PRODUCT_NUMBER: 100
  },
  ownershipsSeeder: {
    // ?????????????????????????????????????????????1~3???
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
      // ????????????
      SUM: 100,
      // ?????????????????????
      REST: 50
    },
    DEFEAULT_PRICE: {
      MIN: 1000,
      MAX: 3000
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
  // helper,
  cache,
  utility,
  service,
  generalConfig,
  middleware,
  seeder

}
