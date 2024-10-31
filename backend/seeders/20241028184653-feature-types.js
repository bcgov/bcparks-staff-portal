/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("FeatureTypes", [
      {
        name: "Frontcountry Camping",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Group Camping",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("FeatureTypes", null, {});
  },
};
