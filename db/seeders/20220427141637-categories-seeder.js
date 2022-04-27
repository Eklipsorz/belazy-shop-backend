'use strict'
const {
  DEFAULT_CATEGORY,
  DEFAULT_CATEGORY_NUMBER
} = require('../../config/app').seeder.categoriesSeeder

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
    const categoryArray = Array.from({ length: DEFAULT_CATEGORY_NUMBER }, (_, i) => ({
      name: DEFAULT_CATEGORY[i].name,
      image: DEFAULT_CATEGORY[i].image,
      created_at: new Date(),
      updated_at: new Date()
    }))

    seederArray.push(...categoryArray)

    await queryInterface.bulkInsert('categories', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('categories')
  }
}
