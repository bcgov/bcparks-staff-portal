/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("GateDetails", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      parkId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Parks",
          key: "id",
        },
      },
      parkAreaId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "ParkAreas",
          key: "id",
        },
      },
      featureId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Features",
          key: "id",
        },
      },
      hasGate: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gateOpenTime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      gateCloseTime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      gateOpensAtDawn: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gateClosesAtDusk: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gateOpen24Hours: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isTimeRangeAnnual: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable("GateDetails");
  },
};
