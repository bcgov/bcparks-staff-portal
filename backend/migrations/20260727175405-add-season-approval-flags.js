/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        "Seasons",
        "informationSvcApproved",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "Seasons",
        "reservationSvcApproved",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );

      // Set both approval flags to true for all seasons that are already approved or published
      await queryInterface.bulkUpdate(
        "Seasons",
        {
          informationSvcApproved: true,
          reservationSvcApproved: true,
        },
        {
          status: {
            [Sequelize.Op.in]: ["approved", "published"],
          },
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.error("Error running migration:", error);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn("Seasons", "reservationSvcApproved", {
        transaction,
      });
      await queryInterface.removeColumn("Seasons", "informationSvcApproved", {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      console.error("Error undoing migration:", error);
      await transaction.rollback();
      throw error;
    }
  },
};
