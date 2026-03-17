/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("DateRangeAnnuals", "dateableId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Dateables",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DateRangeAnnuals", "dateableId");
  },
};
