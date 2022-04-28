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
      Product.hasOne(models.Stock, { foreignKey: 'productId' })
      Product.hasOne(models.ProductStatistic, { foreignKey: 'productId' })
      Product.hasMany(models.CategoryStatistic, { foreignKey: 'productId' })
      Product.hasMany(models.Like, { foreignKey: 'productId' })
      Product.hasMany(models.Reply, { foreignKey: 'productId' })
    }
  }
  Product.init({
    name: DataTypes.STRING(30),
    introduction: DataTypes.STRING(255),
    price: DataTypes.INTEGER,
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
