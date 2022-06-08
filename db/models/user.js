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
      User.hasOne(models.UserStatistic, { foreignKey: 'userId' })
      User.hasMany(models.Like, { foreignKey: 'userId', as: 'likedProducts' })
      User.hasMany(models.Reply, { foreignKey: 'userId', as: 'repliedProducts' })
      User.hasMany(models.Order, { foreignKey: 'userId' })
    }
  }
  User.init({
    account: DataTypes.STRING(10),
    password: DataTypes.STRING(255),
    role: DataTypes.STRING(30),
    email: DataTypes.STRING(255),
    avatar: DataTypes.STRING(255),
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
