/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add "hasTier1Dates" and "hasTier2Dates" columns to the "Parks" table
    await queryInterface.addColumn("Parks", "hasTier1Dates", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indicates if the Park can have the Tier 1 date type",
    });

    await queryInterface.addColumn("Parks", "hasTier2Dates", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indicates if the Park can have the Tier 2 date type",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove "hasTier1Dates" and "hasTier2Dates" columns from the "Parks" table
    await queryInterface.removeColumn("Parks", "hasTier1Dates");
    await queryInterface.removeColumn("Parks", "hasTier2Dates");
  },
};
