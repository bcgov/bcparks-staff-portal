/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // create table to manage many-to-many relationship between Parks and Bundles
    await queryInterface.createTable("ParkBundles", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      parkId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Parks",
          key: "id",
        },
      },
      bundleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Bundles",
          key: "id",
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // add unique index to prevent duplicate relationships
    await queryInterface.addIndex("ParkBundles", ["parkId", "bundleId"], {
      unique: true,
    });

    // remove bundleId column from Parks
    await queryInterface.removeConstraint("Parks", "Parks_bundleId_fkey");

    await queryInterface.removeColumn("Parks", "bundleId");
  },

  async down(queryInterface, Sequelize) {
    // Add bundleId column back to Parks
    await queryInterface.addColumn("Parks", "bundleId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Bundles",
        key: "id",
      },
    });

    await queryInterface.dropTable("ParkBundles");
  },
};
