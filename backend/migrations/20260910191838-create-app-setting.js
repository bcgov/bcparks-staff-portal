/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("AppSettings", {
      key: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true,
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

    await queryInterface.bulkInsert("AppSettings", [
      {
        key: "notificationsEnabled",
        value: JSON.stringify(false),
        description:
          "Global switch controlling whether the app sends any email notifications",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        key: "areaSupervisorNotificationsEnabled",
        value: JSON.stringify(false),
        description: "Whether email notifications are sent to area supervisors",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("AppSettings");
  },
};
