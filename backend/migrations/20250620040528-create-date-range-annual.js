/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("DateRangeAnnuals", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      dateTypeId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "DateTypes",
          key: "id",
        },
      },
      publishableId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Publishables",
          key: "id",
        },
      },
      isDateRangeAnnual: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable("DateRangeAnnuals");
  },
};
