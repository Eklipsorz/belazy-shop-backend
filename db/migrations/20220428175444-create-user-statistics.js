'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_statistics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      like_tally: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      reply_tally: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      order_tally: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_statistics')
  }
}
