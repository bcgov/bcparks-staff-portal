/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("DateTypes", "parkLevel", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("DateTypes", "featureLevel", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("DateTypes", "parkAreaLevel", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DateTypes", "parkLevel");
    await queryInterface.removeColumn("DateTypes", "featureLevel");
    await queryInterface.removeColumn("DateTypes", "parkAreaLevel");
  },
};
