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
      operatingYear: {
        type: Sequelize.INTEGER,
      },
      parkId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Parks",
          key: "id",
        },
      },
      featureTypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: "FeatureTypes",
          key: "id",
        },
      },
      status: {
        type: Sequelize.STRING,
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
