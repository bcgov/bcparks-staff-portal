/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("UserAccessGroups", "username", {
      type: Sequelize.STRING,
      // Keep nullable because we don't have all the usernames yet
      // and some users who aren't in AccessGroups may not need them.
      allowNull: true,
    });

    await queryInterface.addIndex("UserAccessGroups", ["username"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("UserAccessGroups", ["username"]);

    await queryInterface.removeColumn("UserAccessGroups", "username");
  },
};
