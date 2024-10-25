/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("CampsiteGroupings", [
      {
        siteRangeDescription: "1-10",
        campgroundId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        siteRangeDescription: "11-20",
        campgroundId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        siteRangeDescription: "21-30",
        campgroundId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        siteRangeDescription: "1-10",
        campgroundId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        siteRangeDescription: "11-20",
        campgroundId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        siteRangeDescription: "21-30",
        campgroundId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("CampsiteGroupings", null, {});
  },
};
