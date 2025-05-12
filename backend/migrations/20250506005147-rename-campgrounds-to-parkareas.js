/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable("Campgrounds", "ParkAreas");

    // Remove the foreign key constraint, rename the column, and add the new constraint
    await queryInterface.removeConstraint(
      "Features",
      "Features_campgroundId_fkey",
    );
    await queryInterface.renameColumn("Features", "campgroundId", "parkAreaId");
    await queryInterface.addConstraint("Features", {
      fields: ["parkAreaId"],
      type: "foreign key",
      name: "Features_parkAreaId_fkey",
      references: {
        table: "ParkAreas",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable("ParkAreas", "Campgrounds");

    await queryInterface.removeConstraint(
      "Features",
      "Features_parkAreaId_fkey",
    );
    await queryInterface.renameColumn("Features", "parkAreaId", "campgroundId");
    await queryInterface.addConstraint("Features", {
      fields: ["campgroundId"],
      type: "foreign key",
      name: "Features_campgroundId_fkey",
      references: {
        table: "Campgrounds",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
};
