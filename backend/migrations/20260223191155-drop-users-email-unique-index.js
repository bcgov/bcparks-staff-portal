/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Drop the unique index/constraint on Users.email.
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex("Users", ["email"]);
  },

  // Rollback: Re-create the unique index on Users.email exactly as it was added in
  // backend/migrations/20250522221250-add-acessgroup-tables.j
  async down(queryInterface, Sequelize) {
    await queryInterface.addIndex("Users", ["email"], { unique: true });
  },
};
