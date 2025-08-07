/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Seasons', 'featureTypeId');
    await queryInterface.removeColumn('Seasons', 'parkId');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Seasons', 'featureTypeId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Seasons', 'parkId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};
