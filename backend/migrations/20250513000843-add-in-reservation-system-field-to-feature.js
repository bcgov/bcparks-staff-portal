/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add inReservationSystem field to Features
    await queryInterface.addColumn("Features", "inReservationSystem", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove inReservationSystem field from Features
    await queryInterface.removeColumn("Features", "inReservationSystem");
  },
};
