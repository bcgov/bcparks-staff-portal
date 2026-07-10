/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create performance indexes for /parks query optimization
    // These indexes optimize filtering, joining, and sorting operations

    // Index for Parks.hasDates filter
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_Parks_hasDates" ON "Parks"("hasDates")',
    );

    // Index for Seasons.operatingYear filter (used in every season query)
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_Seasons_operatingYear" ON "Seasons"("operatingYear")',
    );

    // Composite index for Seasons join + operatingYear filter
    // This allows DB to filter and join in a single index scan
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_Seasons_publishableId_operatingYear" ON "Seasons"("publishableId", "operatingYear")',
    );

    // Composite index for Features.active + Features.hasDates filters
    // Allows efficient filtering without table scans
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_Features_active_hasDates" ON "Features"("active", "hasDates")',
    );

    // Composite index for Features join + active + hasDates filters
    // Optimizes parkAreas.features query with required:true
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_Features_parkId_active_hasDates" ON "Features"("parkId", "active", "hasDates")',
    );

    // Used in the Season -> SeasonChangeLog include with notes filter
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_SeasonChangeLogs_seasonId" ON "SeasonChangeLogs"("seasonId")',
    );

    // Used in SeasonChangeLog -> User join
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_SeasonChangeLogs_userId" ON "SeasonChangeLogs"("userId")',
    );

    // Composite index for SeasonChangeLogs join + notes filter
    // Optimizes the required:false include with non-empty notes filter
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "idx_SeasonChangeLogs_seasonId_notes" ON "SeasonChangeLogs"("seasonId", "notes")',
    );
  },

  async down(queryInterface, Sequelize) {
    // Drop all performance indexes created in up migration
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_Parks_hasDates"',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_Seasons_operatingYear"',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_Seasons_publishableId_operatingYear"',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_Features_active_hasDates"',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_Features_parkId_active_hasDates"',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_SeasonChangeLogs_seasonId"',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_SeasonChangeLogs_userId"',
    );
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS "idx_SeasonChangeLogs_seasonId_notes"',
    );
  },
};
