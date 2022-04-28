'use strict'
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      detail: {
        type: Sequelize.STRING(255)
      },
      sum: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING(10)
      },
      receiver_name: {
        type: Sequelize.STRING(255)
      },
      receiver_phone: {
        type: Sequelize.STRING(10)
      },
      receiver_addr: {
        type: Sequelize.STRING(255)
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
    await queryInterface.dropTable('orders')
  }
}
