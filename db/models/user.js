'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  user.init({
    account: DataTypes.STRING(10),
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    email: DataTypes.STRING,
    avatar: DataTypes.STRING,
    aliasname: DataTypes.STRING(30)
  }, {
    sequelize,
    underscored: true,
    modelName: 'user'
  })
  return user
}
