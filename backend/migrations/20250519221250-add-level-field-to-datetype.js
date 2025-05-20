/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("DateTypes", "level", {
      type: Sequelize.ENUM("park", "feature"),
      allowNull: false,
      defaultValue: "feature",
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DateTypes", "level");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_DateTypes_level";');
  },
};
