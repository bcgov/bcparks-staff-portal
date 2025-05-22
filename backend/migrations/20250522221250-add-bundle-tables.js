/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add a table for Bundles (groups of Parks that Users have access to)
    // We just need the ID, but we may also want to display the name in the future
    await queryInterface.createTable("Bundles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add an index to the User.email column - we'll use it to look up permissions in UserBundles
    await queryInterface.addIndex("Users", ["email"], { unique: true });

    // Add a table for UserBundles (which Users have access to which Bundles)
    await queryInterface.createTable("UserBundles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
      },

      bundleId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Bundles",
          key: "id",
        },
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes to the columns we'll join on
    await queryInterface.addIndex("UserBundles", ["userId"]);
    await queryInterface.addIndex("UserBundles", ["bundleId"]);

    // Add a table for BundleParks (which Parks are in which Bundles)
    await queryInterface.createTable("BundleParks", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      bundleId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Bundles",
          key: "id",
        },
      },

      parkId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Parks",
          key: "id",
        },
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes to the columns we'll join on
    await queryInterface.addIndex("BundleParks", ["bundleId"]);
    await queryInterface.addIndex("BundleParks", ["parkId"]);
  },

  async down(queryInterface, Sequelize) {
    // Drop the Bundle association tables
    await queryInterface.dropTable("UserBundles");
    await queryInterface.dropTable("BundleParks");

    // Drop the Bundles table
    await queryInterface.dropTable("Bundles");

    // Remove the index from the User.email column
    await queryInterface.removeIndex("Users", ["email"]);
  },
};
