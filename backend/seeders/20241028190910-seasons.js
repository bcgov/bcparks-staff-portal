/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Seasons", [
      {
        operatingYear: 2024,
        parkId: 1,
        featureTypeId: 1,
        status: "not started",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2024,
        parkId: 1,
        featureTypeId: 2,
        status: "not started",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2025,
        parkId: 1,
        featureTypeId: 1,
        status: "not started",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2025,
        parkId: 1,
        featureTypeId: 2,
        status: "not started",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2024,
        parkId: 2,
        featureTypeId: 2,
        status: "not started",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2025,
        parkId: 2,
        featureTypeId: 2,
        status: "not started",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Seasons", null, {});
  },
};
