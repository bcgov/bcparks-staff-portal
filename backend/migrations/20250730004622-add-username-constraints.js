/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key constraint for username
    await queryInterface.addConstraint("UserAccessGroups", {
      fields: ["username"],
      type: "foreign key",
      name: "UserAccessGroups_username_fkey",
      references: {
        table: "Users",
        field: "username",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Remove the userEmail column
    await queryInterface.removeColumn("UserAccessGroups", "userEmail");
  },

  async down(queryInterface, Sequelize) {
    // Add back userEmail column
    await queryInterface.addColumn("UserAccessGroups", "userEmail", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Remove username foreign key constraint
    await queryInterface.removeConstraint(
      "UserAccessGroups",
      "UserAccessGroups_username_fkey",
    );
  },
};
