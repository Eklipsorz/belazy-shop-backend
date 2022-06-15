'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class CartSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      CartSession.belongsTo(models.User, { foreignKey: 'userId' })
      CartSession.hasMany(models.Cart, { foreignKey: 'cartId' })
    }
  }
  CartSession.init({
    id: DataTypes.UUID,
    userId: DataTypes.INTEGER,
    total: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'CartSession',
    tableName: 'cart_sessions'
  })
  return CartSession
}
