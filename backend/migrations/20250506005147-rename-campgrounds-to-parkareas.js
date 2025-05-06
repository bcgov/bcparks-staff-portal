/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable("Campgrounds", "ParkAreas");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable("ParkAreas", "Campgrounds");
  },
};
