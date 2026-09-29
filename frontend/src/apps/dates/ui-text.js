// English UI text for the Dates of Operation Tool frontend
export default {
  // Structure: <Feature/area> -> <Component/section>

  // NOTE: DateType descriptions come Strapi.
  // They're synced to the DOOT DB and served by the DOOT backend.

  gateForm: {
    gateOpenHours: {
      tooltip:
        "Regular daily hours the gate is open. If hours are irregular, or change throughout the year, leave this blank and enter the schedule in 'Internal notes'. If you would rather not publish gate hours, leave hours blank.",
    },
  },

  seasonStatus: {
    notReadyFlag: {
      tooltip: "Dates not ready to be made public",
    },
    submittedWithErrorsWarning: {
      tooltip: "Submitted with errors",
    },
  },
};
