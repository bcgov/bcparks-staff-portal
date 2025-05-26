/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add a table for AccessGroups (groups of Parks that Users have access to)
    // We just need the ID, but we may also want to display the name in the future
    await queryInterface.createTable("AccessGroups", {
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

    // Add an index to the Users.email column - we'll use it to look up permissions in UserAccessGroups
    await queryInterface.addIndex("Users", ["email"], { unique: true });

    // Add an index to the Parks.orcs column - we'll use it to look up permissions in AccessGroupParks
    await queryInterface.addIndex("Parks", ["orcs"], { unique: true });

    // Add a table for UserAccessGroups (which Users have access to which AccessGroups)
    await queryInterface.createTable("UserAccessGroups", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      userEmail: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "Users",
          key: "email",
        },
      },

      accessGroupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "AccessGroups",
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
    await queryInterface.addIndex("UserAccessGroups", ["userEmail"]);
    await queryInterface.addIndex("UserAccessGroups", ["accessGroupId"]);

    // Add a table for AccessGroupParks (which Parks are in which AccessGroups)
    await queryInterface.createTable("AccessGroupParks", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      accessGroupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "AccessGroups",
          key: "id",
        },
      },

      parkOrcs: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "Parks",
          key: "orcs",
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
    await queryInterface.addIndex("AccessGroupParks", ["accessGroupId"]);
    await queryInterface.addIndex("AccessGroupParks", ["parkOrcs"]);
  },

  async down(queryInterface, Sequelize) {
    // Drop the AccessGroup association tables
    await queryInterface.dropTable("UserAccessGroups");
    await queryInterface.dropTable("AccessGroupParks");

    // Drop the AccessGroups table
    await queryInterface.dropTable("AccessGroups");

    // Remove the index from the Users.email column
    await queryInterface.removeIndex("Users", ["email"]);

    // Remove the index from the Parks.orcs column
    await queryInterface.removeIndex("Parks", ["orcs"]);
  },
};
