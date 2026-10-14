/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const [result] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) AS count FROM "Features" WHERE "featureTypeId" IS NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );

      if (Number(result.count) > 0) {
        throw new Error(
          `Cannot require featureTypeId: ${result.count} Features have no feature type. ` +
            "Assign a valid feature type to each Feature before running this migration.",
        );
      }

      await queryInterface.sequelize.query(
        'ALTER TABLE "Features" ALTER COLUMN "featureTypeId" SET NOT NULL',
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "Features" ALTER COLUMN "featureTypeId" DROP NOT NULL',
    );
  },
};
