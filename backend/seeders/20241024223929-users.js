/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Users", [
      {
        idir: "bcparks-staff",
        staff: true,
        parkOperatorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idir: "operator-sea-to-sky",
        staff: false,
        parkOperatorId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        idir: "operator-alouette",
        staff: false,
        parkOperatorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Users", null, {});
  },
};
