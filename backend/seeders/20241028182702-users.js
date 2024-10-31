/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Users", [
      {
        name: "User staff",
        email: "diego@oxd.com",
        staff: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "User GE operator",
        email: "diego+ge-operator@oxd.com",
        staff: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "User Alice operator",
        email: "diego+alice-operator@oxd.com",
        staff: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Users", null, {});
  },
};
