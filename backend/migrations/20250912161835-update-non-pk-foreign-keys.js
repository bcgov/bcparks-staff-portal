/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add new userId column (nullable at first)
    await queryInterface.addColumn("UserAccessGroups", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true, // temporarily nullable
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 2. Copy data into userId
    await queryInterface.sequelize.query(`
      UPDATE "UserAccessGroups" uag
      SET "userId" = usr.id
      FROM "Users" usr
      WHERE uag."username" = usr."username";
    `);

    // 3. Change userId to NOT NULL
    await queryInterface.changeColumn("UserAccessGroups", "userId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 4. Drop old username column
    await queryInterface.removeColumn("UserAccessGroups", "username");

    // 5. Add new parkId column (nullable at first)
    await queryInterface.addColumn("AccessGroupParks", "parkId", {
      type: Sequelize.INTEGER,
      allowNull: true, // temporarily nullable
      references: {
        model: "Parks",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 6. Copy data into parkId
    await queryInterface.sequelize.query(`
      UPDATE "AccessGroupParks" agp
      SET "parkId" = p.id
      FROM "Parks" p
      WHERE agp."parkOrcs" = p."orcs";
    `);

    // 7. Change parkId to NOT NULL
    await queryInterface.changeColumn("AccessGroupParks", "parkId", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Parks",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    // 8. Drop old parkOrcs column
    await queryInterface.removeColumn("AccessGroupParks", "parkOrcs");
  },

  async down(queryInterface, Sequelize) {
    // Revert AccessGroupParks
    await queryInterface.addColumn("AccessGroupParks", "parkOrcs", {
      type: Sequelize.STRING,
      allowNull: true, // temporarily nullable
      references: {
        model: "Parks",
        key: "orcs",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.sequelize.query(`
      UPDATE "AccessGroupParks" agp
      SET "parkOrcs" = p."orcs"
      FROM "Parks" p
      WHERE agp."parkId" = p.id;
    `);

    await queryInterface.changeColumn("AccessGroupParks", "parkOrcs", {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: "Parks",
        key: "orcs",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.removeColumn("AccessGroupParks", "parkId");

    // Revert UserAccessGroups
    await queryInterface.addColumn("UserAccessGroups", "username", {
      type: Sequelize.STRING,
      allowNull: true, // temporarily nullable
      references: {
        model: "Users",
        key: "username",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.sequelize.query(`
      UPDATE "UserAccessGroups" uag
      SET "username" = usr."username"
      FROM "Users" usr
      WHERE uag."userId" = usr.id;
    `);

    await queryInterface.changeColumn("UserAccessGroups", "username", {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: "Users",
        key: "username",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });

    await queryInterface.removeColumn("UserAccessGroups", "userId");
  },
};
