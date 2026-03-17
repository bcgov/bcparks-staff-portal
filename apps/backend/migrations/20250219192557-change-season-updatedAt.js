/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // allow null values for updatedAt
    await queryInterface.changeColumn("Seasons", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // disallow null values for updatedAt
    await queryInterface.changeColumn("Seasons", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
