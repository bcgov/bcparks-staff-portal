/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("SeasonChangeLogs", "notes", {
      type: Sequelize.STRING(2000),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("SeasonChangeLogs", "notes", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
