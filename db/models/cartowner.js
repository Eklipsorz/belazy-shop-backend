'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class CartOwner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CartOwner.init({
    userId: DataTypes.INTEGER,
    cartId: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'CartOwner',
    tableName: 'cart_owners'
  })
  return CartOwner
}
