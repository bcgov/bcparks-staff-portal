/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Seasons", [
      {
        year: 2024,
        status: "requested",
        parkId: 1,
        orcs: "golden-ears-1",
        featureTypeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        year: 2024,
        status: "under review",
        parkId: 2,
        orcs: "pinecone-burke-1",
        featureTypeId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Seasons", null, {});
  },
};
