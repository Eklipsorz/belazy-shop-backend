'use strict'
/*
同個產品會有5個人評論
在同個產品上，每個評論者皆為不同人
在同個產品上，每個評論者只會對產品擁有一次的評論
*/
const { repliesSeeder } = require('../../config/app').seeder
const { generateOptions } = require('../../helpers/number-generator')
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
    // 獲取所有使用者的ID

    const seedUsers = (await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE role="user"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )).map(item => item.id)
    // 獲取所有產品的ID
    const seedProducts = (await queryInterface.sequelize.query(
      'SELECT id FROM products',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )).map(item => item.id)

    const replyArray = []
    const { CURRENT } = repliesSeeder.DEFAULT_OPTIONS_NUMBER
    const optionMaxNum = seedUsers.length
    // 依據產品來給予五個人的回覆
    seedProducts.forEach(productId => {
      // 從使用者挑出五位不重複的使用者索引值
      const options = generateOptions(CURRENT, optionMaxNum)

      options.forEach(option => {
        const index = Number(option)
        const userId = seedUsers[index]
        replyArray.push({
          user_id: userId,
          product_id: productId,
          content: faker.lorem.paragraph().substring(0, 255),
          created_at: new Date(),
          updated_at: new Date()
        })
      })
    })

    seederArray.push(...replyArray)
    // 依據所有現有產生回覆的資料來執行SQL
    await queryInterface.bulkInsert('replies', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('replies')
  }
}
