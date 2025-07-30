/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add username column as nullable first
    await queryInterface.addColumn("Users", "username", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Populate existing users with temporary usernames to satisfy the unique constraint
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET username = 'TEMPORARY_' || gen_random_uuid()::text
      WHERE username IS NULL
    `);

    // Now make username NOT NULL
    await queryInterface.changeColumn("Users", "username", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Add unique constraint
    await queryInterface.addConstraint("Users", {
      fields: ["username"],
      type: "unique",
      name: "Users_username_unique",
    });

    // Add index for performance
    await queryInterface.addIndex("Users", ["username"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Users", ["username"]);
    await queryInterface.removeConstraint("Users", "Users_username_unique");
    await queryInterface.removeColumn("Users", "username");
  },
};
