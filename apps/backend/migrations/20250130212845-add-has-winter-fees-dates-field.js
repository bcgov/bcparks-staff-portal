/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // add hasWinterFeeDates field to Feature
    await queryInterface.addColumn("Features", "hasWinterFeeDates", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // remove hasWinterFeeDates field from Feature
    await queryInterface.removeColumn("Features", "hasWinterFeeDates");
  },
};
