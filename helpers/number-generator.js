// 產出不重複的索引值
function generateOptions(optionNum, optionMaxNum) {
  const optionHashTab = {}
  while (true) {
    const selectedOption = Math.floor(Math.random() * optionMaxNum)
    optionHashTab[`${selectedOption}`] = true
    if (Object.keys(optionHashTab).length === optionNum) break
  }

  return Object.keys(optionHashTab)
}

exports = module.exports = {
  generateOptions
}
