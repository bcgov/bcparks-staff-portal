/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Check for NULL publishableId values. changeColumn to allowNull: false will fail if any exist.
      const [{ count: nullCount }] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM "GateDetails" WHERE "publishableId" IS NULL`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      if (nullCount > 0) {
        throw new Error(
          `Cannot add NOT NULL constraint: ${nullCount} row(s) with NULL publishableId found. ` +
            `Please ensure all GateDetail records have a publishableId before running this migration.`,
        );
      }

      // Check for duplicate publishableId values before adding the UNIQUE constraint.
      // If duplicates exist, the constraint will fail to apply.
      const duplicates = await queryInterface.sequelize.query(
        `
        SELECT "publishableId", COUNT(*) as count
        FROM "GateDetails"
        WHERE "publishableId" IS NOT NULL
        GROUP BY "publishableId"
        HAVING COUNT(*) > 1
      `,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map((d) => d.publishableId).join(", ");

        throw new Error(
          `Cannot add unique constraint: Duplicate publishableId values found: ${duplicateIds}. ` +
            `Please remove duplicate GateDetail records before running this migration.`,
        );
      }

      // Make publishableId NOT NULL
      await queryInterface.changeColumn(
        "GateDetails",
        "publishableId",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );

      // Add a unique constraint on publishableId to prevent duplicates.
      // This ensures only one GateDetail record can exist per publishableId.
      await queryInterface.addConstraint(
        "GateDetails",
        {
          fields: ["publishableId"],
          type: "unique",
          name: "GateDetails_publishableId_unique",
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "GateDetails",
      "GateDetails_publishableId_unique",
    );

    await queryInterface.changeColumn("GateDetails", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
