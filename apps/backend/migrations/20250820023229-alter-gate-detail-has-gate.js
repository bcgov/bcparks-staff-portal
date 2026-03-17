/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("GateDetails", "hasGate", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    });
  },
  async down(queryInterface, Sequelize) {
    // Set all NULL values to false before making the column NOT NULL
    await queryInterface.sequelize.query(
      `UPDATE "GateDetails" SET "hasGate" = false WHERE "hasGate" IS NULL;`,
    );
    await queryInterface.changeColumn("GateDetails", "hasGate", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
