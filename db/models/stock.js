'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Stock.belongsTo(models.Product, { foreignKey: 'productId' })
    }
  }
  Stock.init({
    productId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    restQuantity: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Stock',
    tableName: 'stock',
    underscored: true
  })
  return Stock
}
