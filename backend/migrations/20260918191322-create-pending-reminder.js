/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PendingReminders", {
      emailType: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      numericData: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      jsonData: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      comparisonDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      notifyManagementArea: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notifyInformationServices: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notifyReservationServices: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      followupAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("PendingReminders", ["followupAt"], {
      name: "pending_reminders_followup_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "PendingReminders",
      "pending_reminders_followup_at_idx",
    );
    await queryInterface.dropTable("PendingReminders");
  },
};
