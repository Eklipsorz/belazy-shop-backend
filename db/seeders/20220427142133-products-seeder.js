'use strict'

const { productsSeeder } = require('../../config/app').seeder
const { faker } = require('@faker-js/faker')
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

    const { DEFAULT_PRODUCT_NUMBER, DEFEAULT_PRICE } = productsSeeder
    const { MAX, MIN } = DEFEAULT_PRICE
    const productNum = DEFAULT_PRODUCT_NUMBER

    const productArray = Array.from({ length: productNum }, (_, i) => ({
      name: faker.name.firstName().substring(0, 30),
      introduction: faker.lorem.paragraph().substring(0, 255),
      price: Math.floor(Math.random() * (MAX - MIN) + 1) + MIN,
      image: `https://loremflickr.com/320/240/product?lock=${(Math.random() * 100) + 1}`,
      created_at: new Date(),
      updated_at: new Date()
    }))

    seederArray.push(...productArray)

    await queryInterface.bulkInsert('products', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('products')
  }
}
