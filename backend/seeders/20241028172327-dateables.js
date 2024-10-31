/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Dateables", [
      {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Dateables", null, {});
  },
};
