/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Parks", "isDateRangeAnnual", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("ParkAreas", "isDateRangeAnnual", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("Features", "isDateRangeAnnual", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Parks", "isDateRangeAnnual");
    await queryInterface.removeColumn("ParkAreas", "isDateRangeAnnual");
    await queryInterface.removeColumn("Features", "isDateRangeAnnual");
  },
};
