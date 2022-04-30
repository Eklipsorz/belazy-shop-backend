
class APIError extends Error {
  constructor(options) {
    super(options.message)
    this.code = options.code
    // solve that error object cannot output array info
    this.message = options.message
    this.status = options.status
    this.data = options.data
  }
}

exports = module.exports = {
  APIError
}
