'use strict'

const { ownershipsSeeder } = require('../../config/app').seeder
const { generateOptions } = require('../../helpers/number-generator')

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
    // 獲取一組產品陣列，由產品id所組成
    const seedProducts = (await queryInterface.sequelize.query(
      'SELECT id FROM products',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )).map(item => item.id)

    // 獲取一組類別陣列，每一個元素為{id:xxx, name:xxx}
    const seedCategories = (await queryInterface.sequelize.query(
      'SELECT id, name FROM categories',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    ))

    const { MAX, MIN } = ownershipsSeeder.DEFAULT_OPTIONS_NUMBER
    const categoryNum = seedCategories.length
    const statisticsArray = []

    // 為每個產品選幾個種類
    seedProducts.forEach(productId => {
      // 確定每個產品能選多少個種類
      const optionNum = Math.floor(Math.random() * (MAX - MIN) + 1) + MIN
      // 以種類的索引值為選項來產出
      const options = generateOptions(optionNum, categoryNum)
      // 分配種類並轉換準備要產出的資料
      options.forEach(option => {
        const index = Number(option)
        const selectedCategory = seedCategories[index]
        statisticsArray.push({
          product_id: productId,
          category_id: selectedCategory.id,
          category_name: selectedCategory.name,
          created_at: new Date(),
          updated_at: new Date()
        })
      })
    })

    seederArray.push(...statisticsArray)
    await queryInterface.bulkInsert('ownerships', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('ownerships')
  }
}
