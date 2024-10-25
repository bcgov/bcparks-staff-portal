/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "ParkFeatures",
      "ParkFeatures_bundleId_fkey",
    );

    // Then remove the column
    await queryInterface.removeColumn("ParkFeatures", "bundleId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("ParkFeatures", "bundleId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Bundles",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    });
  },
};
