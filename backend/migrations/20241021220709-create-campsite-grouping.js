/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CampsiteGroupings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      siteRangeDescription: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      campgroundId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Campgrounds",
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
    await queryInterface.dropTable("CampsiteGroupings");
  },
};
