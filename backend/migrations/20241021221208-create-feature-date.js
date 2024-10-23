/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("FeatureDates", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      operatingYear: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      isDateRangeAnnual: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      parkFeatureId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "ParkFeatures",
          key: "id",
        },
      },
      dateTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "DateTypes",
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("FeatureDates");
  },
};
