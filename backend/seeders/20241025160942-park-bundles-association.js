/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const parks = await queryInterface.sequelize.query(
      `SELECT id, orcs FROM "Parks";`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    const bundles = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Bundles";`,
      { type: Sequelize.QueryTypes.SELECT },
    );

    const parkMap = parks.reduce((acc, park) => {
      acc[park.orcs] = park.id;
      return acc;
    }, {});

    const bundleMap = bundles.reduce((acc, bundle) => {
      acc[bundle.name] = bundle.id;
      return acc;
    }, {});

    const parkBundleRelations = [
      {
        parkId: parkMap["golden-ears-1"],
        bundleId: bundleMap["Coquitlam Bundle"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        parkId: parkMap["pinecone-burke-1"],
        bundleId: bundleMap["Alouette Bundle"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert("ParkBundles", parkBundleRelations);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("ParkBundles", null, {});
  },
};
