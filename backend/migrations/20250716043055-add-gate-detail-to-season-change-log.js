/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SeasonChangeLogs", "gateDetailOldValue", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("SeasonChangeLogs", "gateDetailNewValue", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SeasonChangeLogs", "gateDetailOldValue");
    await queryInterface.removeColumn("SeasonChangeLogs", "gateDetailNewValue");
  },
};
