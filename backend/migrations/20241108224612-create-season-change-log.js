/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("SeasonChangeLogs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      seasonId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Seasons",
          key: "id",
        },
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
      },
      notes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      statusOldValue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      statusNewValue: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      readyToPublishOldValue: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      readyToPublishNewValue: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable("SeasonChangeLogs");
  },
};
