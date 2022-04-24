'use strict'
const {
  // User
  DEFAULT_PASSWORD,
  DEFAULT_BCRYPT_COMPLEXITY,
  DEFAULT_EMAIL_PREFIX,
  DEFAULT_EMAIL_SUFFIX,
  DEFAULT_USER_NUMBER
} = require('../../config/seeder').usersSeeder

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
      password: bcrypt.hashSync(DEFAULT_PASSWORD, DEFAULT_BCRYPT_COMPLEXITY),
      role: 'admin',
      email: `${DEFAULT_EMAIL_PREFIX}+0@${DEFAULT_EMAIL_SUFFIX}`,
      avatar: faker.image.avatar(),
      nickname: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    })

    let userArray = []
    // add n users account (n => DEFAULT_USER_NUMBER)
    userArray = Array.from({ length: DEFAULT_USER_NUMBER }, (_, index) => ({
      account: `user${index + 1}`,
      password: bcrypt.hashSync(DEFAULT_PASSWORD, DEFAULT_BCRYPT_COMPLEXITY),
      role: 'user',
      email: `${DEFAULT_EMAIL_PREFIX}+${index + 1}@${DEFAULT_EMAIL_SUFFIX}`,
      avatar: faker.image.avatar(),
      nickname: `user${index + 1}`,
      created_at: new Date(),
      updated_at: new Date()
    }))

    seederArray.push(...userArray)

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
