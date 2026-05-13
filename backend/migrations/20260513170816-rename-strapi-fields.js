/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename Strapi human-assigned number fields
    await queryInterface.renameColumn(
      "DateTypes",
      "strapiDateTypeId",
      "dateTypeNumber",
    );
    await queryInterface.renameColumn(
      "FeatureTypes",
      "strapiFeatureTypeId",
      "featureTypeNumber",
    );
    await queryInterface.renameColumn(
      "Features",
      "strapiOrcsFeatureNumber",
      "orcsFeatureNumber",
    );
    await queryInterface.renameColumn(
      "ParkAreas",
      "strapiOrcsAreaNumber",
      "orcsAreaNumber",
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      "DateTypes",
      "dateTypeNumber",
      "strapiDateTypeId",
    );
    await queryInterface.renameColumn(
      "FeatureTypes",
      "featureTypeNumber",
      "strapiFeatureTypeId",
    );
    await queryInterface.renameColumn(
      "Features",
      "orcsFeatureNumber",
      "strapiOrcsFeatureNumber",
    );
    await queryInterface.renameColumn(
      "ParkAreas",
      "orcsAreaNumber",
      "strapiOrcsAreaNumber",
    );
  },
};
