/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DateRanges", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      startDate: {
        type: Sequelize.DATE,
      },
      endDate: {
        type: Sequelize.DATE,
      },
      dateTypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: "DateTypes",
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
      seasonId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Seasons",
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
    await queryInterface.dropTable("DateRanges");
  },
};
