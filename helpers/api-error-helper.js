
class APIError extends Error {
  constructor(options) {
    super(options.message)
    this.code = options.code
    this.status = options.status
    this.data = options.data
  }
}

exports = module.exports = {
  APIError
}
