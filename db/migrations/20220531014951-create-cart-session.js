'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('carts', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      sum: {
        allowNull: false,
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('carts')
  }
}
