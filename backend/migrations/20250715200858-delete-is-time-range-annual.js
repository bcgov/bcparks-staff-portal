/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn("GateDetails", "isTimeRangeAnnual");
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("GateDetails", "isTimeRangeAnnual", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
