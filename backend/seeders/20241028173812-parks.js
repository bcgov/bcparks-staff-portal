/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Parks", [
      {
        name: "Golen Ears",
        orcs: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Mable Lake",
        orcs: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Parks", null, {});
  },
};
