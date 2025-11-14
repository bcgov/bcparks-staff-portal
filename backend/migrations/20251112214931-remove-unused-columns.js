/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the "staff" column from the "Users" table
    await queryInterface.removeColumn("Users", "staff");

    // Remove the "adminNote" column from the "DateRanges" table
    await queryInterface.removeColumn("DateRanges", "adminNote");
  },

  async down(queryInterface, Sequelize) {
    // Add the "staff" column back to the "Users" table
    await queryInterface.addColumn("Users", "staff", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // Add the "adminNote" column back to the "DateRanges" table
    await queryInterface.addColumn("DateRanges", "adminNote", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
