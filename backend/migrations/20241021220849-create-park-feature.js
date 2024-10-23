/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ParkFeatures", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      hasReservations: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      featureTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "FeatureTypes",
          key: "id",
        },
      },
      campsiteGroupingId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "CampsiteGroupings",
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
    await queryInterface.dropTable("ParkFeatures");
  },
};
