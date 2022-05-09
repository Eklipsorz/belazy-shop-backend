const Fuse = require('fuse.js')
class NumberToolKit {
  static fuzzySearch({ data, field, keyword }) {
    const fuseOptions = {
      keys: [field]
    }
    console.log('inside', data, field, keyword)
    const fuse = new Fuse(data, fuseOptions)
    const fuseResults = fuse.search(keyword)
    console.log('result', fuseResults)
    return fuseResults.map(fr => fr.item)
  }

  static exactSearch({ data, field, keyword }) {
    return data.filter(item => item[field] === keyword)
  }
}

exports = module.exports = {
  NumberToolKit
}
