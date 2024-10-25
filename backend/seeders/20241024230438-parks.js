/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Parks", [
      {
        orcs: "golden-ears-1",
        name: "Golden Ears",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orcs: "pinecone-burke-1",
        name: "Pinecone Burke",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Parks", null, {});
  },
};
