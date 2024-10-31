/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("Campgrounds", [
      {
        name: "Alouette Campground",
        parkId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Woodlands Campground",
        parkId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Monashee",
        parkId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Taylor Creek",
        parkId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Trinity",
        parkId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("Campgrounds", null, {});
  },
};
