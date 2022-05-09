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

  // 產出不重複的索引值
  static generateOptions(optionNum, optionMaxNum) {
    const optionHashTab = {}
    while (true) {
      const selectedOption = Math.floor(Math.random() * optionMaxNum)
      optionHashTab[`${selectedOption}`] = true
      if (Object.keys(optionHashTab).length === optionNum) break
    }

    return Object.keys(optionHashTab)
  }
}

exports = module.exports = {
  ArrayToolKit
}
