/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Seasons", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      orcs: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Parks",
          key: "id",
        },
      },
      featureTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "FeatureTypes",
          key: "id",
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Seasons");
  },
};
