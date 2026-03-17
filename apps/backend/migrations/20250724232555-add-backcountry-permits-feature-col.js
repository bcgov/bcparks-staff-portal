/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add hasBackcountryPermits field to Features
    await queryInterface.addColumn("Features", "hasBackcountryPermits", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove hasBackcountryPermits field from Features
    await queryInterface.removeColumn("Features", "hasBackcountryPermits");
  },
};
