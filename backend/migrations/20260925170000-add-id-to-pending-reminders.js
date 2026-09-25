/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Replace the composite primary key with a serial id (AdminJS only supports
    // single-column ids) and keep emailType + numericData unique for upserts.
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Only deployed to test environments so far, so existing reminders can be discarded
      await queryInterface.bulkDelete("PendingReminders", null, {
        transaction,
      });

      await queryInterface.removeConstraint(
        "PendingReminders",
        "PendingReminders_pkey",
        { transaction },
      );

      await queryInterface.addColumn(
        "PendingReminders",
        "id",
        {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
        },
        { transaction },
      );

      // addColumn ignores primaryKey on Postgres, so add it explicitly
      await queryInterface.addConstraint("PendingReminders", {
        fields: ["id"],
        type: "primary key",
        name: "PendingReminders_pkey",
        transaction,
      });

      await queryInterface.addConstraint("PendingReminders", {
        fields: ["emailType", "numericData"],
        type: "unique",
        name: "PendingReminders_emailType_numericData_unique",
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        "PendingReminders",
        "PendingReminders_emailType_numericData_unique",
        { transaction },
      );

      // Dropping the column also drops its primary key and sequence
      await queryInterface.removeColumn("PendingReminders", "id", {
        transaction,
      });

      await queryInterface.addConstraint("PendingReminders", {
        fields: ["emailType", "numericData"],
        type: "primary key",
        name: "PendingReminders_pkey",
        transaction,
      });
    });
  },
};
