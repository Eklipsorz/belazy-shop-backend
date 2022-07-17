const Fuse = require('fuse.js')
const { code } = require('../config/result-status-table').errorTable
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

  // validate whether there is a something on current page
  static getArrayByCurrentPage(array, offset, limit) {
    let result = {}
    const currentPage = array.slice(offset, limit + offset)
    if (!currentPage.length) {
      result = { code: code.NOTFOUND, data: null, message: '找不到對應項目' }
      return { error: true, result }
    }
    result = currentPage
    return { error: false, result }
  }
}

exports = module.exports = {
  ArrayToolKit
}
