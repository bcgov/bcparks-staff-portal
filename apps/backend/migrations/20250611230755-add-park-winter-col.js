/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove hasWinterFeeDates field from Feature
    await queryInterface.removeColumn("Features", "hasWinterFeeDates");

    // Add hasWinterFeeDates field to Park
    await queryInterface.addColumn("Parks", "hasWinterFeeDates", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove hasWinterFeeDates field from Park
    await queryInterface.removeColumn("Parks", "hasWinterFeeDates");

    // Add hasWinterFeeDates field back to Feature
    await queryInterface.addColumn("Features", "hasWinterFeeDates", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
