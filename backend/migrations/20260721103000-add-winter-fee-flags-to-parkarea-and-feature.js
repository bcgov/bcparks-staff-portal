/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("ParkAreas", "hasWinterFeeDates", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("Features", "hasWinterFeeDates", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("ParkAreas", "hasWinterFeeDates");
    await queryInterface.removeColumn("Features", "hasWinterFeeDates");
  },
};
