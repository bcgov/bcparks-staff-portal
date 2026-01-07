/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DateTypes", "startDateLabel");
    await queryInterface.removeColumn("DateTypes", "endDateLabel");
    await queryInterface.removeColumn("DateTypes", "parkAreaLevel");
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("DateTypes", "startDateLabel", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("DateTypes", "endDateLabel", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("DateTypes", "parkAreaLevel", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
