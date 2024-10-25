/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Bundles", [
      {
        name: "Coquitlam Bundle",
        parkOperatorId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Alouette Bundle",
        parkOperatorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Bundles", null, {});
  },
};
