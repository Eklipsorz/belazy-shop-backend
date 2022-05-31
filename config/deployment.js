const { project } = require('./project')
require('dotenv').config({ path: project.ENV })

const cache = {
  BASEDAYS: 1,
  // Minute range
  MINRANGE: {
    MIN: 360,
    MAX: 1440
  }
}

exports = module.exports = {
  cache
}
