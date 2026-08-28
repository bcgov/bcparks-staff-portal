/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make publishableId NOT NULL
    await queryInterface.changeColumn("GateDetails", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    // Add a unique constraint on publishableId to prevent duplicates.
    // This ensures only one GateDetail record can exist per publishableId.
    await queryInterface.addConstraint("GateDetails", {
      fields: ["publishableId"],
      type: "unique",
      name: "unique_gatedetail_publishableid",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "GateDetails",
      "unique_gatedetail_publishableid",
    );

    await queryInterface.changeColumn("GateDetails", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
