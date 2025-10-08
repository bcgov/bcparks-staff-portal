/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add strapiId field to DateTypes
    await queryInterface.addColumn("DateTypes", "strapiId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove strapiId field from DateTypes
    await queryInterface.removeColumn("DateTypes", "strapiId");
  },
};
