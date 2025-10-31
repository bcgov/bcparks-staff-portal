/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update all existing records to true
    await queryInterface.sequelize.query(
      'UPDATE "Seasons" SET "readyToPublish" = true WHERE "readyToPublish" IS NULL OR "readyToPublish" = false;'
    );

    // Then change the column definition
    await queryInterface.changeColumn("Seasons", "readyToPublish", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert column definition
    await queryInterface.changeColumn("Seasons", "readyToPublish", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Optionally revert all values back to false
    await queryInterface.sequelize.query(
      'UPDATE "Seasons" SET "readyToPublish" = false;'
    );
  },
};
