'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      account: {
        type: Sequelize.STRING(10)
      },
      password: {
        type: Sequelize.STRING(255)
      },
      role: {
        type: Sequelize.STRING(30)
      },
      email: {
        type: Sequelize.STRING(255)
      },
      avatar: {
        type: Sequelize.STRING(255),
        defaultValue: 'https://i.imgur.com/6xxypgv.png'
      },
      nickname: {
        type: Sequelize.STRING(30)
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
    await queryInterface.dropTable('users')
  }
}
