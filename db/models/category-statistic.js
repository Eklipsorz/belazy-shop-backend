'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class CategoryStatistic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CategoryStatistic.belongsTo(Model.Product, { foreignKey: 'productId' })
      CategoryStatistic.belongsTo(Model.Category, { foreignKey: 'categoryId' })
    }
  }
  CategoryStatistic.init({
    productId: DataTypes.INTEGER,
    categoryId: DataTypes.INTEGER,
    categoryName: DataTypes.STRING(30),
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    underscored: true,
    modelName: 'CategoryStatistic',
    tableName: 'category_statistics'
  })
  return CategoryStatistic
}
