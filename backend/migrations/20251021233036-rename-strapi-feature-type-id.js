/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename column to match naming in DateTypes
    await queryInterface.renameColumn(
      "FeatureTypes",
      "strapiId",
      "strapiFeatureTypeId",
    );

    // Note: the down migration doesn't undo this step because the old strapiId
    // values aren't used for anything. We add 1000 to all existing values first
    // to avoid unique constraint violations when assigning new values.
    await queryInterface.sequelize.query(`
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = "strapiFeatureTypeId" + 1000;
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 1  WHERE name = 'Anchorage';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 2  WHERE name = 'Backcountry';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 3  WHERE name = 'Boat launch';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 4  WHERE name = 'Cabin';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 5  WHERE name = 'Dock';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 6  WHERE name = 'Frontcountry campground';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 7  WHERE name = 'Group campground';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 8  WHERE name = 'Hot spring';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 9  WHERE name = 'Hut';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 10 WHERE name = 'Marine-accessible camping';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 11 WHERE name = 'Mooring buoy';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 12 WHERE name = 'Picnic area';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 13 WHERE name = 'Picnic shelter';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 14 WHERE name = 'Resort';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 15 WHERE name = 'Shelter';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 16 WHERE name = 'Trail';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 17 WHERE name = 'Walk-in camping';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 18 WHERE name = 'Wilderness camping';
      UPDATE "FeatureTypes" SET "strapiFeatureTypeId" = 19 WHERE name = 'Winter camping';
`);

    // Remove unused columns
    await queryInterface.removeColumn("FeatureTypes", "publishableId");
    await queryInterface.removeColumn("FeatureTypes", "dateableId");
  },

  async down(queryInterface, Sequelize) {
    // Revert column name change
    await queryInterface.renameColumn(
      "FeatureTypes",
      "strapiFeatureTypeId",
      "strapiId",
    );

    // Re-add removed columns
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
    await queryInterface.addColumn("FeatureTypes", "dateableId", {
      type: Sequelize.INTEGER,
      references: {
        model: "Dateables",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
};
