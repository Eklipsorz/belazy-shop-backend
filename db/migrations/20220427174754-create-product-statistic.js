'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_statistics', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      product_id: {
        type: Sequelize.INTEGER
      },
      liked_tally: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      replied_tally: {
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
    await queryInterface.dropTable('product_statistics')
  }
}
