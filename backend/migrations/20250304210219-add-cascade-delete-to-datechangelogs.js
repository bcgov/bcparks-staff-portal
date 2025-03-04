/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the existing constraint without CASCADE
    await queryInterface.removeConstraint(
      "DateChangeLogs",
      "DateChangeLogs_dateRangeId_fkey",
    );

    // Add a new constraint with CASCADE
    await queryInterface.addConstraint("DateChangeLogs", {
      fields: ["dateRangeId"],
      type: "foreign key",
      name: "DateChangeLogs_dateRangeId_fkey",
      references: {
        table: "DateRanges",
        field: "id",
      },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the created constraint with CASCADE
    await queryInterface.removeConstraint(
      "DateChangeLogs",
      "DateChangeLogs_dateRangeId_fkey",
    );

    // Recreate the old constraint without CASCADE
    await queryInterface.addConstraint("DateChangeLogs", {
      fields: ["dateRangeId"],
      type: "foreign key",
      name: "DateChangeLogs_dateRangeId_fkey",
      references: {
        table: "DateRanges",
        field: "id",
      },
    });
  },
};
