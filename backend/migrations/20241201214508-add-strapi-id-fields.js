/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Parks", "strapiId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn("Features", "strapiId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
    });

    await queryInterface.addColumn("FeatureTypes", "strapiId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Parks", "strapiId");
    await queryInterface.removeColumn("Features", "strapiId");
    await queryInterface.removeColumn("FeatureTypes", "strapiId");
  },
};
