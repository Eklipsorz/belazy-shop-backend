'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    account: DataTypes.STRING(10),
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    email: DataTypes.STRING,
    avatar: DataTypes.STRING,
    nickname: DataTypes.STRING(30),
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    underscored: true,
    modelName: 'User',
    tableName: 'users'
  })

  return User
}
