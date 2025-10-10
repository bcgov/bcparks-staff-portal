/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add strapiDateTypeId field to DateTypes
    await queryInterface.addColumn("DateTypes", "strapiDateTypeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove strapiDateTypeId field from DateTypes
    await queryInterface.removeColumn("DateTypes", "strapiDateTypeId");
  },
};
