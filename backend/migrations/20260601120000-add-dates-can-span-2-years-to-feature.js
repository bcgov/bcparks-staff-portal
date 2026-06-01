/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the new column to the Features table
    await queryInterface.addColumn("Features", "datesCanSpan2Years", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  // Remove the column from the Features table
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Features", "datesCanSpan2Years");
  },
};
