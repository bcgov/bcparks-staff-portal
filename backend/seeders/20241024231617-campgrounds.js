/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Campgrounds", [
      {
        name: "GE Campground 1",
        orcs: "golden-ears-1",
        parkId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "PB Campground 1",
        orcs: "pinecone-burke-1",
        parkId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Campgrounds", null, {});
  },
};
