'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Order.init({
    userId: DataTypes.INTEGER,
    detail: DataTypes.STRING(255),
    sum: DataTypes.INTEGER,
    status: DataTypes.STRING(10),
    receiverName: DataTypes.STRING(255),
    receiverPhone: DataTypes.STRING(10),
    receiverAddr: DataTypes.STRING(255),
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    underscored: true
  })
  return Order
}