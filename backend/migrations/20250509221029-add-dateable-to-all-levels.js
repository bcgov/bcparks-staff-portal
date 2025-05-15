/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add dateableId to all taxonomy levels
    await queryInterface.addColumn("ParkAreas", "dateableId", {
      type: Sequelize.INTEGER,
      references: {
        model: "Dateables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("FeatureTypes", "dateableId", {
      type: Sequelize.INTEGER,
      references: {
        model: "Dateables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ParkAreas", "dateableId");
    await queryInterface.removeColumn("FeatureTypes", "dateableId");
  },
};
