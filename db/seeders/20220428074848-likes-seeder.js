'use strict'

const { likesSeeder } = require('../../config/app').seeder
const { ArrayToolKit } = require('../../utils/array-tool-kit')

/*
同個產品會有5個人喜歡
在同個產品的喜歡，每個喜歡者皆為不同人
在同個產品的喜歡，每個喜歡者只會對產品擁有一次的喜歡
*/
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

    const likeArray = []
    const { CURRENT } = likesSeeder.DEFAULT_OPTIONS_NUMBER
    const optionMaxNum = seedUsers.length
    // 依據產品來給予五個人的喜歡
    seedProducts.forEach(productId => {
      // 從使用者挑出五位不重複的使用者索引值
      const options = ArrayToolKit.generateOptions(CURRENT, optionMaxNum)
      options.forEach(option => {
        const index = Number(option)
        const userId = seedUsers[index]
        likeArray.push({
          user_id: userId,
          product_id: productId,
          created_at: new Date(),
          updated_at: new Date()
        })
      })
    })

    seederArray.push(...likeArray)
    // 依據所有現有產生喜歡的資料來執行SQL
    await queryInterface.bulkInsert('likes', likeArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('likes')
  }
}
