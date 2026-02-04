/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Clean up incorrect date ranges from winter seasons.
    // Winter seasons should only have Winter fee date types (strapiDateTypeId = 4),
    // not Tier 1, Tier 2, Park gate open, or other regular season date types.

    await queryInterface.sequelize.query(`
      DELETE FROM "DateRanges"
      WHERE "seasonId" IN (
        SELECT s.id
        FROM "Seasons" s
        WHERE s."seasonType" = 'winter'
      )
      AND "dateTypeId" IN (
        SELECT dt.id
        FROM "DateTypes" dt
        WHERE dt."strapiDateTypeId" != 4
      )
    `);
  },

  async down(queryInterface, Sequelize) {
    // This migration cannot be easily reversed since we're deleting data
    // that was incorrectly created. The down migration would need to recreate
    // the incorrect data, which we don't want to do.
    console.log(
      "Cannot reverse cleanup of incorrect winter season date ranges",
    );
    console.log("This data was incorrectly created and should not be restored");
  },
};
