/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Features", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
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
      dateableId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Dateables",
          key: "id",
        },
      },
      hasReservations: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      campgroundId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Campgrounds",
          key: "id",
        },
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    await queryInterface.dropTable("Features");
  },
};
