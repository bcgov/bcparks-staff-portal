/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add a SeasonType ENUM column to the Seasons table with values "regular" or "winter"
    await queryInterface.addColumn("Seasons", "seasonType", {
      type: Sequelize.ENUM("regular", "winter"),
      allowNull: false,
      defaultValue: "regular",
    });

    // Update the 'seasonType' for the "winter" featureTypeId
    await queryInterface.sequelize.query(`
      UPDATE "Seasons"
      SET "seasonType" = 'winter'
      WHERE "featureTypeId" = (SELECT "id" FROM "FeatureTypes" WHERE "name" = 'Winter fee' LIMIT 1)
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Seasons", "seasonType");
  },
};
