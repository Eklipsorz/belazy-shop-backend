'use strict'
const { productStatisticsSeeder } = require('../../config/app').seeder
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
    // 獲取所有產品
    const seedProducts = (await queryInterface.sequelize.query(
      'SELECT id FROM products',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )).map(item => item.id)
    // 設定每個產品下的被喜歡數和被評論數
    const statisticsArray = []
    const { DEFAULT_TALLY } = productStatisticsSeeder

    // 根據設定來執行SQL
    seedProducts.forEach(productId => {
      statisticsArray.push({
        product_id: productId,
        liked_tally: DEFAULT_TALLY.LIKED,
        replied_tally: DEFAULT_TALLY.RELIED,
        created_at: new Date(),
        updated_at: new Date()
      })
    })

    seederArray.push(...statisticsArray)
    await queryInterface.bulkInsert('product_statistics', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('product_statistics')
  }
}
