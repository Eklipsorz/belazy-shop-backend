'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.hasMany(models.Cart, { foreignKey: 'productId' })
      Product.hasOne(models.Stock, { foreignKey: 'productId', as: 'stock' })
      Product.hasOne(models.ProductStatistic, { foreignKey: 'productId', as: 'statistics' })
      Product.hasMany(models.Ownership, { foreignKey: 'productId', as: 'productCategory' })
      Product.hasMany(models.Like, { foreignKey: 'productId' })
      Product.hasMany(models.Reply, { foreignKey: 'productId' })
      Product.hasMany(models.OrderDetail, { foreignKey: 'productId' })
    }
  }
  Product.init({
    name: DataTypes.STRING(30),
    introduction: DataTypes.STRING(255),
    image: DataTypes.STRING(255),
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    underscored: true,
    modelName: 'Product',
    tableName: 'products'
  })
  return Product
}
