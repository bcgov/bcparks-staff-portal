/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // To keep old seasons backwards compatible,
    // create publishables for every FeatureType
    // and populate the publishableId field for every v1 season.

    // Do everything in a transaction
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Get all FeatureType IDs
      const featureTypes = await queryInterface.sequelize.query(
        `SELECT id FROM "FeatureTypes"`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      // Update
      for (const featureType of featureTypes) {
        // Insert a new Publishable record
        const [newPublishable] = await queryInterface.sequelize.query(
          'INSERT INTO "Publishables" ("createdAt", "updatedAt") VALUES (NOW(), NOW()) RETURNING id',
          { type: Sequelize.QueryTypes.INSERT, transaction },
        );

        const publishableId = newPublishable[0].id;

        // Update the FeatureType with the new publishableId
        await queryInterface.sequelize.query(
          'UPDATE "FeatureTypes" SET "publishableId" = :publishableId WHERE "id" = :featureTypeId',
          {
            replacements: { publishableId, featureTypeId: featureType.id },
            transaction,
          },
        );

        // Update Seasons with the publishableId for each FeatureType
        const seasonUpdate = await queryInterface.sequelize.query(
          'UPDATE "Seasons" SET "publishableId" = :publishableId WHERE "featureTypeId" = :featureTypeId',
          {
            replacements: { publishableId, featureTypeId: featureType.id },
            transaction,
          },
        );
      }

      await transaction.commit();
    } catch (error) {
      console.error("Error running migration:", error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Do everything in a transaction
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove the added publishableIds from FeatureTypes and Seasons
      await queryInterface.sequelize.query(
        'UPDATE "FeatureTypes" SET "publishableId" = NULL',
        { transaction },
      );

      await queryInterface.sequelize.query(
        'UPDATE "Seasons" SET "publishableId" = NULL',
        { transaction },
      );

      // Empty the Publishables table
      await queryInterface.sequelize.query('DELETE FROM "Publishables"', {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      console.error("Error undoing migration:", error);
      await transaction.rollback();
      throw error;
    }
  },
};
