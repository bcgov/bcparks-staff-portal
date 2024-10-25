/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("FeatureTypes", [
      {
        name: "Frontcountry camping",
        hasCampsites: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Group camping",
        hasCampsites: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("FeatureTypes", null, {});
  },
};
