/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DateChangeLogs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      dateRangeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "DateRanges",
          key: "id",
        },
      },
      seasonChangeLogId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "SeasonChangeLogs",
          key: "id",
        },
      },
      startDateOldValue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      startDateNewValue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      endDateOldValue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      endDateNewValue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("DateChangeLogs");
  },
};
