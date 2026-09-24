/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check for duplicate dateableId values before adding the UNIQUE constraint.
    // If duplicates exist, the constraint will fail to apply.
    const duplicates = await queryInterface.sequelize.query(
      `
      SELECT "dateableId", COUNT(*) as count
      FROM "Features"
      WHERE "dateableId" IS NOT NULL
      GROUP BY "dateableId"
      HAVING COUNT(*) > 1
    `,
      { type: Sequelize.QueryTypes.SELECT },
    );

    if (duplicates.length > 0) {
      const duplicateIds = duplicates.map((d) => d.dateableId).join(", ");

      throw new Error(
        `Cannot add unique constraint: Duplicate dateableId values found: ${duplicateIds}. ` +
          `Please ensure each Feature has its own Dateable before running this migration.`,
      );
    }

    // Add a unique constraint on dateableId so each Dateable belongs to at most one Feature.
    // dateableId stays nullable; Postgres allows multiple NULLs in a UNIQUE column.
    await queryInterface.addConstraint("Features", {
      fields: ["dateableId"],
      type: "unique",
      name: "Features_dateableId_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      "Features",
      "Features_dateableId_unique",
    );
  },
};
