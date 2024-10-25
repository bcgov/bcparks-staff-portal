/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("DateTypes", [
      {
        name: "Operating Dates",
        startLabel: "season start",
        endLabel: "season end",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Reservation Dates",
        startLabel: "reservation start",
        endLabel: "reservation end",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("DateTypes", null, {});
  },
};
