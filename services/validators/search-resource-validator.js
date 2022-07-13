const { project } = require('../../config/project')
require('dotenv').config({ path: project.ENV })

class SearchResourceValidator {
  // skip getSearchHints
  // skip searchProducts
  // skip searchProductsFromCategory
}

exports = module.exports = {
  SearchResourceValidator
}
