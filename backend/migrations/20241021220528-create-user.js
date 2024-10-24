/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      idir: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      staff: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      parkOperatorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "ParkOperators",
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
    await queryInterface.dropTable("Users");
  },
};
