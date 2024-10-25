/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Campsites", [
      {
        name: "1",
        campsiteNumber: 1,
        campsiteGroupingId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "2",
        campsiteNumber: 2,
        campsiteGroupingId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "1",
        campsiteNumber: 1,
        campsiteGroupingId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "2",
        campsiteNumber: 2,
        campsiteGroupingId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "1",
        campsiteNumber: 1,
        campsiteGroupingId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "2",
        campsiteNumber: 2,
        campsiteGroupingId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "1",
        campsiteNumber: 1,
        campsiteGroupingId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "2",
        campsiteNumber: 2,
        campsiteGroupingId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Campsites", null, {});
  },
};
