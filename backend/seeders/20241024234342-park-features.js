/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("ParkFeatures", [
      {
        name: "Golden Ears Campsites 1-10",
        hasReservations: true,
        orcs: "golden-ears-1",
        parkId: 1,
        active: true,
        featureTypeId: 1,
        campsiteGroupingId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Golden Ears Campsites 11-20",
        hasReservations: true,
        orcs: "golden-ears-1",
        parkId: 1,
        active: true,
        featureTypeId: 1,
        campsiteGroupingId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Pinecone Burke Campsites 1-10",
        hasReservations: true,
        orcs: "pinecone-burke-1",
        parkId: 1,
        active: true,
        featureTypeId: 2,
        campsiteGroupingId: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Pinecone Burke Campsites 11-20",
        hasReservations: true,
        orcs: "pinecone-burke-1",
        parkId: 1,
        active: true,
        featureTypeId: 2,
        campsiteGroupingId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("ParkFeatures", null, {});
  },
};
