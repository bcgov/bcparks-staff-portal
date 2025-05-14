/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Publishables", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add publishableId FK to all taxonomy levels, including Seasons
    await queryInterface.addColumn("Parks", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null values: some items may never be published by themselves
      references: {
        model: "Publishables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // If the referenced record is deleted, set this foreign key to NULL
    });

    await queryInterface.addColumn("ParkAreas", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null values: some items may never be published by themselves
      references: {
        model: "Publishables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // If the referenced record is deleted, set this foreign key to NULL
    });

    await queryInterface.addColumn("FeatureTypes", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null values: some items may never be published by themselves
      references: {
        model: "Publishables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // If the referenced record is deleted, set this foreign key to NULL
    });

    await queryInterface.addColumn("Features", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null values: some items may never be published by themselves
      references: {
        model: "Publishables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // If the referenced record is deleted, set this foreign key to NULL
    });

    await queryInterface.addColumn("Seasons", "publishableId", {
      type: Sequelize.INTEGER,
      allowNull: true, // Allow null values: some items may never be published by themselves
      references: {
        model: "Publishables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // If the referenced record is deleted, set this foreign key to NULL
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Publishables");

    // Remove the foreign keys
    await queryInterface.removeColumn("Parks", "publishableId");
    await queryInterface.removeColumn("ParkAreas", "publishableId");
    await queryInterface.removeColumn("FeatureTypes", "publishableId");
    await queryInterface.removeColumn("Features", "publishableId");
    await queryInterface.removeColumn("Seasons", "publishableId");
  },
};
