'use strict'
/*
管理者帳號不用擁有使用者資料統計
每個一般使用者帳號必須擁有使用者資料統計
每個使用者資料統計一開始的計數(產品喜歡數、產品評論數、訂單數)皆為0
按照實際種子資料來更新使用者資料統計種子資料上的產品喜歡數
按照實際種子資料來更新使用者資料統計種子資料上的產品評論數
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

    // 獲取一般使用者清單
    const seedUsers = (await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE role="user"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )).map(item => item.id)

    // 獲取喜歡表格的所有資料，每筆資料為(user_id)
    const seedLikes = (await queryInterface.sequelize.query(
      'SELECT user_id FROM likes',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )).map(item => item.user_id)

    // 獲取評論表格的所有資料，每筆資料為(user_id)
    const seedRelies = (await queryInterface.sequelize.query(
      'SELECT user_id FROM replies',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    )).map(item => item.user_id)

    // 替每個一般使用者建立各自使用者資料統計紀錄，紀錄中的計數(產品喜歡數、產品評論數、訂單數)皆為0
    // 先寫成object，方便找到值，最後在轉換成陣列
    const statisticsObject = {}

    seedUsers.forEach(userId => {
      statisticsObject[userId] = {
        user_id: userId,
        like_tally: 0,
        reply_tally: 0,
        order_tally: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    // 利用喜歡表格下的資料(user_id)來計算每個使用者的產品喜歡數，並更新統計資料表格
    const TallyTable = statisticsObject

    seedLikes.forEach(userId => {
      if (!TallyTable[userId].like_tally) TallyTable[userId].like_tally = 1
      else ++TallyTable[userId].like_tally
    })

    // 利用評論表格下的資料(user_id)來計算每個使用者的產品評論數，並更新統計資料表格
    seedRelies.forEach(userId => {
      if (!TallyTable[userId].reply_tally) TallyTable[userId].reply_tally = 1
      else ++TallyTable[userId].reply_tally
    })

    // {key1: value1, key2: value2,.... } => [value1, value2,....]
    const statisticsArray = Object.keys(statisticsObject).map(key => statisticsObject[key])

    seederArray.push(...statisticsArray)
    await queryInterface.bulkInsert('user_statistics', seederArray)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('user_statistics')
  }
}
