
const { dirname } = require('path')
const appDir = dirname(require.main.filename)
console.log(appDir)
// require('dotenv').config({ path: path.resolve(process.env.PROJECT, '.env') })
