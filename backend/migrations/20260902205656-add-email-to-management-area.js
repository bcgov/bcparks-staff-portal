/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Synchronize the ManagementAreas ID sequence after restoring data from
    // production, where the sequence value may not match the highest existing ID.
    await queryInterface.sequelize.query(`
      WITH m AS (SELECT MAX(id) AS max_id FROM "ManagementAreas")
      SELECT setval(
        pg_get_serial_sequence('"ManagementAreas"', 'id'),
        COALESCE(m.max_id, 1),
        m.max_id IS NOT NULL
      )
      FROM m;
    `);

    await queryInterface.addColumn("ManagementAreas", "email", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ManagementAreas", "email");
  },
};
