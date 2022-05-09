const { AccountService } = require('./account')
const { ProductService } = require('../resources/product')
const { CategoryService } = require('../resources/category')
const { userService } = require('../../config/app').service
const { APIError } = require('../../helpers/api-error')
const { code, status } = require('../../config/result-status-table').errorTable
const { ArrayToolKit } = require('../../helpers/array-tool-kit')
const { getUser } = require('../../helpers/auth-user-getter')

// isLiked & isReplied status marker for each product
function statusMarker(req, products) {
  const loginUser = getUser(req)

  products = Array.isArray(products) ? products : [products]

  const likedProducts = loginUser.likedProducts
  const repliedProducts = loginUser.repliedProducts

  products.forEach(product => {
    product.isLiked = likedProducts.some(lp => lp.productId === product.id)
    product.isReplied = repliedProducts.some(rp => rp.productId === product.id)
  })
}

class UserService extends AccountService {
  constructor() {
    super('user')
  }

  // get all products
  async getProducts(req, cb) {
    const { error, data, message } = await ProductService.getProducts(req, 'get')
    if (error) return cb(error, data, message)

    try {
      const products = data.resultProducts
      statusMarker(req, products)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get a specific product
  async getProduct(req, cb) {
    const { error, data, message } = await ProductService.getProduct(req)

    if (error) return cb(error, data, message)
    try {
      const product = data
      statusMarker(req, product)
      return cb(null, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get search hint when user input something in search bar
  async getSearchHints(req, cb) {
    const { error, data, message } = await ProductService.getSearchHints(req)
    if (error) return cb(error, data, message)

    try {
      const hintNumber = userService.SEARCH_HINT_NUMBER
      const results = data.slice(0, hintNumber)
      return cb(error, results, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // search product with a specific product name
  async searchProducts(req, cb) {
    try {
      const { keyword, by, page, limit, offset } = req.query
      const { AVABILABLE_BY_OPTION } = userService
      const matchingType = by?.toLowerCase()
      // check whether keyword is empty
      if (!keyword) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: '關鍵字為空' }))
      }

      // check whether by is empty
      if (!matchingType) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為空' }))
      }

      // check whether by is correct
      if (!AVABILABLE_BY_OPTION.includes(matchingType)) {
        return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為錯誤' }))
      }

      const { error, data, message } = await ProductService.getProducts(req, 'search')
      if (error) return cb(error, data, message)
      let result = ''

      const searchOption = { data: data.resultProducts, field: 'name', keyword }

      switch (matchingType) {
        case 'relevancy':
          result = ArrayToolKit.fuzzySearch(searchOption)
          break
        case 'accuracy':
          result = ArrayToolKit.exactSearch(searchOption)
          break
      }

      if (!result.length) {
        return cb(new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }))
      }
      // paging
      const resultProducts = result.slice(offset, offset + limit)
      // mark isLiked & isReplied
      statusMarker(req, resultProducts)

      return cb(null, { currentPage: page, resultProducts }, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // search products with a specific category
  async searchProductsFromCategory(req, cb) {
    try {

      // const { keyword, by, page, limit, offset } = req.query
      // const { AVABILABLE_BY_OPTION } = userService
      // const matchingType = by?.toLowerCase()

      // // check whether keyword is empty
      // if (!keyword) {
      //   return cb(new APIError({ code: code.BADREQUEST, status, message: '關鍵字為空' }))
      // }

      // // check whether by is empty
      // if (!by) {
      //   return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為空' }))
      // }

      // // check whether by is correct
      // if (!AVABILABLE_BY_OPTION.includes(matchingType)) {
      //   return cb(new APIError({ code: code.BADREQUEST, status, message: 'by參數為錯誤' }))
      // }

      // // get all category
      // const { error, data, message } = await CategoryService.getCategories(req, 'search')
      // if (error) return cb(error, data, message)

      // const categories = data.resultCategories

      // // match category according "by" parameter
      // let result = ''
      // const searchOption = { data: categories, field: 'name', keyword }

      // switch (matchingType) {
      //   case 'relevancy':
      //     result = ArrayToolKit.fuzzySearch(searchOption)
      //     break
      //   case 'accuracy':
      //     result = ArrayToolKit.exactSearch(searchOption)
      //     break
      // }
      // if (!result.length) {
      //   return cb(new APIError({ code: code.NOTFOUND, status, message: '找不到產品' }))
      // }
      // // get all products from some specific categories

      // const products = await Promise
      //   .all(
      //     result.map(async item => {
      //       req.params.categoryId = item.id
      //       return await CategoryService.getProductsFromCategory(req, 'search')
      //     })
      //   )

      // // [{error,data,message}, ..] -> [{data.productSet1}, {data.productSet2}]
      // // every productSet is all products for each category
      // // BTW, I use HashTable to de-duplicate the same product
      // const productHashTable = {}
      // const resultProductArrays = products.map(set => {
      //   if (set.error) return []
      //   const productCategory = {
      //     categoryId: set.data.categoryId,
      //     categoryName: set.data.categoryName
      //   }
      //   const products = set.data.resultProducts

      //   const results = products.filter(product => {
      //     if (!productHashTable[product.id]) {
      //       product.productCategory = productCategory
      //       productHashTable[product.id] = true
      //       return product
      //     }
      //   })

      //   return results
      // })
      // // [{data.productSet1}, {data.productSet2}] -> [product1, product2, ....]
      // let resultProducts = resultProductArrays.reduce((prev, next) => prev.concat(next))
      // // paging
      // resultProducts = resultProducts.slice(offset, offset + limit)
      // // mark isLiked & isReplied
      // statusMarker(req, resultProducts)
      // return cb(null, { currentPage: page, resultProducts }, '獲取成功')
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get a specific category
  async getCategory(req, cb) {
    const { error, data, message } = await CategoryService.getCategory(req)
    return cb(error, data, message)
  }

  // get all categories
  async getCategories(req, cb) {
    const { error, data, message } = await CategoryService.getCategories(req)
    return cb(error, data, message)
  }

  // get all products from a specific category
  async getProductsFromCategory(req, cb) {
    const { error, data, message } = await CategoryService.getProductsFromCategory(req)
    if (error) return cb(error, data, message)
    try {
      const products = data.resultProducts
      statusMarker(req, products)
      return cb(error, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }

  // get all products from each category
  async getProductsFromCategories(req, cb) {
    const { error, data, message } = await CategoryService.getProductsFromCategories(req)

    if (error) return cb(error, data, message)
    try {
      const resultSets = data
      resultSets.forEach(set => {
        const products = set.ownedProducts
        statusMarker(req, products)
      })
      return cb(error, data, message)
    } catch (error) {
      return cb(new APIError({ code: code.SERVERERROR, status, message: error.message }))
    }
  }
}

const userServices = new UserService()

exports = module.exports = {
  userServices
}
