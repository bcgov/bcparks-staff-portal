/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("DateTypes", [
      {
        name: "Operation",
        startDateLabel: "season start",
        endDateLabel: "season end",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Reservation",
        startDateLabel: "season start",
        endDateLabel: "season end",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("DateTypes", null, {});
  },
};
