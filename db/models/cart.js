'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Cart.belongsTo(models.User, { foreignKey: 'userId' })
      Cart.hasMany(models.CartItem, { foreignKey: 'cartId' })
    }
  }
  Cart.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true
    },
    userId: DataTypes.INTEGER,
    sum: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Cart',
    tableName: 'carts'
  })
  return Cart
}
