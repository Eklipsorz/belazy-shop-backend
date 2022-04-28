'use strict'
/*
每個產品都有一份庫存量
每一份庫存量的數量為100、剩餘量為50
*/
const { stockSeeder } = require('../../config/app').seeder
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
    // 設定每個產品的庫存和剩餘庫存
    const stockArray = []
    const { DEFAULT_QUANTITY } = stockSeeder
    seedProducts.forEach(productId => {
      stockArray.push({
        product_id: productId,
        quantity: DEFAULT_QUANTITY.SUM,
        rest_quantity: DEFAULT_QUANTITY.REST,
        created_at: new Date(),
        updated_at: new Date()
      })
    })

    seederArray.push(...stockArray)

    // 依照設定的庫存和剩餘庫存來執行對應的SQL
    await queryInterface.bulkInsert('stock', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('stock')
  }
}
