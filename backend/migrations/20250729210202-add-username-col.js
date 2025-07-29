/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "username", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex("Users", ["username"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Users", ["username"]);

    await queryInterface.removeColumn("Users", "username");
  },
};
