/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add inReservationSystem field to ParkAreas
    await queryInterface.addColumn("ParkAreas", "inReservationSystem", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove inReservationSystem field from ParkAreas
    await queryInterface.removeColumn("ParkAreas", "inReservationSystem");
  },
};
