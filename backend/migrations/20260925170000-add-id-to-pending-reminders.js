/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Replace the composite primary key with a serial id (AdminJS only supports
    // single-column ids) and keep emailType + numericData unique for upserts.
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Recreate the table so id is the first column. This table has only been
      // deployed to test environments, so existing reminders can be discarded.
      await queryInterface.dropTable("PendingReminders", { transaction });

      await queryInterface.createTable(
        "PendingReminders",
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
          },
          emailType: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          numericData: {
            type: Sequelize.INTEGER,
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
          followUpDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint("PendingReminders", {
        fields: ["emailType", "numericData"],
        type: "unique",
        name: "PendingReminders_emailType_numericData_unique",
        transaction,
      });

      await queryInterface.addIndex("PendingReminders", ["followUpDate"], {
        name: "pending_reminders_follow_up_date_idx",
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore the original table from 20260918191322-create-pending-reminder
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("PendingReminders", { transaction });

      await queryInterface.createTable(
        "PendingReminders",
        {
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
          followUpDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.addIndex("PendingReminders", ["followUpDate"], {
        name: "pending_reminders_follow_up_date_idx",
        transaction,
      });
    });
  },
};
