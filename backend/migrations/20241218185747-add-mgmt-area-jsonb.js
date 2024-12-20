/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add managementAreaIds to Parks table
    await queryInterface.addColumn("Parks", "managementAreas", {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Parks", "managementAreas");
  },
};
