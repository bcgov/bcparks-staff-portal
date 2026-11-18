/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Drop obsolete DOOT v1 Strapi keys.
    // Parks and Features are now matched by orcs, orcsAreaNumber and orcsFeatureNumber.
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("Features", "strapiFeatureId", {
        transaction,
      });
      await queryInterface.removeColumn("Features", "strapiId", {
        transaction,
      });
      await queryInterface.removeColumn("Parks", "strapiId", { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    // Restores the columns only; the dropped values are not recovered.
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "Parks",
        "strapiId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          unique: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        "Features",
        "strapiId",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          unique: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        "Features",
        "strapiFeatureId",
        {
          type: Sequelize.STRING,
        },
        { transaction },
      );
    });
  },
};
