/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add inReservationSystem column to Parks table
    await queryInterface.addColumn("Parks", "inReservationSystem", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove inReservationSystem column from Parks table
    await queryInterface.removeColumn("Parks", "inReservationSystem");
  },
};
