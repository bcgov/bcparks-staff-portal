/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ParkAreaTypes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
      },
      parkAreaTypeNumber: {
        type: Sequelize.INTEGER,
        unique: true,
      },
      rank: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addColumn("ParkAreas", "parkAreaTypeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "ParkAreaTypes",
        key: "id",
      },
    });

    await queryInterface.addColumn("FeatureTypes", "rank", {
      type: Sequelize.INTEGER,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("ParkAreas", "parkAreaTypeId");
    await queryInterface.removeColumn("FeatureTypes", "rank");
    await queryInterface.dropTable("ParkAreaTypes");
  },
};
