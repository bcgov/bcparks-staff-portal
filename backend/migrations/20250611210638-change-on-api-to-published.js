/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update all Season records with status "on API" to "published"
    await queryInterface.sequelize.query(
      `UPDATE "Seasons" SET "status" = 'published' WHERE "status" = 'on API';`,
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert all Season records with status "published" (that were previously "on API") back to "on API"
    await queryInterface.sequelize.query(
      `UPDATE "Seasons" SET "status" = 'on API' WHERE "status" = 'published';`,
    );
  },
};
