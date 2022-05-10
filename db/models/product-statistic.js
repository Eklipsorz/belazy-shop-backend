'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class ProductStatistic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductStatistic.belongsTo(models.Product, { foreignKey: 'productId' })
    }
  }
  ProductStatistic.init({
    productId: DataTypes.INTEGER,
    likedTally: DataTypes.INTEGER,
    repliedTally: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ProductStatistic',
    tableName: 'product_statistics',
    underscored: true
  })
  return ProductStatistic
}
