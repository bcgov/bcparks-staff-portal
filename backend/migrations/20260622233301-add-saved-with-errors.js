/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the new column to the Seasons table
    await queryInterface.addColumn("Seasons", "savedWithErrors", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment:
        "True when the most recent update to the season bypassed validation errors",
    });
  },

  // Remove the column from the Seasons table
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Seasons", "savedWithErrors");
  },
};
