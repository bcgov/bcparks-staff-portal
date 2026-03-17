/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Change startDate & endDate from timestamp with time zone to date-only
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("DateRanges", "startDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.changeColumn("DateRanges", "endDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  // Revert back to timestamp with time zone
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("DateRanges", "startDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.changeColumn("DateRanges", "endDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
