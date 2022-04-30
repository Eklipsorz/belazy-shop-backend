class ProductService {
  static async getProducts(req, cb) {
    console.log(req.query)
  }
}

exports = module.exports = {
  ProductService
}
