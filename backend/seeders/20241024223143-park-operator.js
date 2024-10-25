/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("ParkOperators", [
      {
        name: "Alouette Park Management Ltd",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Sea to Sky Park Services Ltd.",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("ParkOperators", null, {});
  },
};
