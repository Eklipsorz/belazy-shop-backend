const Fuse = require('fuse.js')
class ArrayToolKit {
  static fuzzySearch({ data, field, keyword }) {
    const fuseOptions = {
      keys: [field]
    }

    const fuse = new Fuse(data, fuseOptions)
    const fuseResults = fuse.search(keyword)
    return fuseResults.map(fr => fr.item)
  }

  static exactSearch({ data, field, keyword }) {
    keyword = keyword.toLowerCase()
    return data.filter(item => item[field].toLowerCase() === keyword)
  }
}

exports = module.exports = {
  ArrayToolKit
}
