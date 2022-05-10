'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class UserStatistic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserStatistic.belongsTo(models.User, { foreignKey: 'userId' })
    }
  }
  UserStatistic.init({
    userId: DataTypes.INTEGER,
    likeTally: DataTypes.INTEGER,
    replyTally: DataTypes.INTEGER,
    orderTally: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'UserStatistic',
    tableName: 'user_statistics',
    underscored: true
  })
  return UserStatistic
}
