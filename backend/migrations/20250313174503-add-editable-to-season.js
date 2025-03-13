/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add editable column to Season
    await queryInterface.addColumn("Seasons", "editable", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove editable column from Season
    await queryInterface.removeColumn("Seasons", "editable");
  },
};
