'use strict'
const {
  // User
  DEFAULT_PASSWORD,
  BCRYPT_COMPLEXITY,
  DEFAULT_USER_NUMBER
} = require('../../config/seeder')

const { faker } = require('@faker-js/faker')
const bcrypt = require('bcryptjs')

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    const seederArray = []

    // add an admin account
    seederArray.push({
      account: 'admin',
      password: DEFAULT_PASSWORD,
      role: 'admin',
      email: 'admin@example.com',
      avatar: faker.image.avatar(),
      aliasname: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    })
    await queryInterface.bulkInsert('users', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('users', null)
  }
}
