'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Ownership extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ownership.belongsTo(models.Product, { foreignKey: 'productId' })
      Ownership.belongsTo(models.Category, { foreignKey: 'categoryId' })
    }
  }
  Ownershipc.init({
    productId: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    categoryName: DataTypes.STRING(30),
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    underscored: true,
    modelName: 'Ownership',
    tableName: 'ownerships'
  })
  return Ownership
}
