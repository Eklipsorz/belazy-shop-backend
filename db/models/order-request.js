'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class OrderRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderRequest.belongsTo(models.Order, { foreignKey: 'orderId' })
    }
  }
  OrderRequest.init({
    orderId: DataTypes.INTEGER,
    header: DataTypes.STRING(10),
    body: DataTypes.STRING(255),
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'OrderRequest',
    tableName: 'order_requests',
    underscored: true
  })
  return OrderRequest
}
