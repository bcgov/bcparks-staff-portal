/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the foreign key constraint on userEmail
    await queryInterface.removeConstraint(
      "UserAccessGroups",
      "UserAccessGroups_userEmail_fkey",
    );

    // Remove the index on userEmail
    await queryInterface.removeIndex(
      "UserAccessGroups",
      "user_access_groups_user_email",
    );
  },

  async down(queryInterface, Sequelize) {
    // Add the index on userEmail
    await queryInterface.addIndex("UserAccessGroups", ["userEmail"], {
      name: "user_access_groups_user_email",
    });

    // Add the foreign key constraint
    await queryInterface.addConstraint("UserAccessGroups", {
      fields: ["userEmail"],
      type: "foreign key",
      name: "UserAccessGroups_userEmail_fkey",
      references: {
        table: "Users",
        field: "email",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
};
