'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Reply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Reply.belongsTo(models.User, { foreignKey: 'userId' })
      Reply.belongsTo(models.Product, { foreignKey: 'productId' })
    }
  }
  Reply.init({
    userId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    content: DataTypes.STRING(255),
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Reply',
    tableName: 'replies',
    underscored: true
  })
  return Reply
}
