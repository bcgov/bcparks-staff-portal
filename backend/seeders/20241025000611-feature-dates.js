/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("FeatureDates", [
      // operating and reservation dates for 2024 for park 1 feature 1
      {
        operatingYear: 2024,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 1,
        dateTypeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2024,
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-10-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 1,
        dateTypeId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // operating and reservation dates for 2024 for park 1 feature 2
      {
        operatingYear: 2024,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 2,
        dateTypeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2024,
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-10-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 2,
        dateTypeId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // operating and reservation dates for 2024 for park 2 feature 1
      {
        operatingYear: 2024,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 3,
        dateTypeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2024,
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-10-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 3,
        dateTypeId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // operating and reservation dates for 2024 for park 2 feature 2
      {
        operatingYear: 2024,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 4,
        dateTypeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        operatingYear: 2024,
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-10-31"),
        isDateRangeAnnual: false,
        parkFeatureId: 4,
        dateTypeId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete("FeatureDates", null, {});
  },
};
