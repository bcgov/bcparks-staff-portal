// English UI text for the Advisories and Closure Tool frontend
export default {
  // Structure: <Feature/area> -> <Component/section>

  dashboard: {
    showArchived: {
      tooltip:
        "By default, advisories that have not been modified in the last 30 days are hidden. Check this box to show all older advisories.",
    },
  },

  advisoryAreaPicker: {
    affectedResources: {
      tooltip: `Select the resource(s) your advisory applies to. Selecting other areas will apply your advisory to all resources within that area.

For example:

- Selecting the 10k Cabin recreation site will apply the advisory or closure to that site only. Selecting the Cascades Resource District will apply the advisory or closure to all sites and trails within that district.
- Selecting Goldstream Park will apply the advisory to that park only. Selecting the West Coast Region will apply the advisory to all parks within that region.`,
    },
  },

  advisoryForm: {
    resourceStatus: {
      tooltip:
        "Describes how the advisory or closure event affects public access to the resource. Default is 'Open'. Status is displayed on the BC Parks Map, RST Map, online advisory and closure lists, and site, trail, or park webpages.",
    },
    eventType: {
      tooltip:
        "Select the most appropriate event type for your advisory or closure. This helps users filter advisories, and allows for internal reporting by type.",
    },
    headline: {
      tooltip:
        "A brief, informative statement with the most urgent or important point for visitors.",
    },
    urgencyLevel: {
      tooltip:
        "Used to prioritize the order and visibility of advisories on the same page. For example, choosing 'high' will place the advisory at the top of the list and highlight it with a red icon.",
    },
    standardMessages: {
      tooltip:
        "Choose from a list of pre-defined messages. This content will be displayed below any text entered in the 'Custom message' field.",
    },
    customMessage: {
      tooltip:
        "Provide more detailed information for visitors about what might affect them. For tips on how to write an effective description, visit the advisory writing guide.",
    },
    attachFiles: {
      tooltip:
        "Adding a file or URL here will display a link at the bottom of the advisory or closure. Multiple items can be added.",
    },
    postingDate: {
      tooltip:
        "Date the advisory will be published. Default is the current date and time. Select a later date and time to schedule delayed posting.",
    },
    expiryDate: {
      tooltip:
        "The advisory will be automatically removed at this date and time.",
    },
    startDate: {
      tooltip:
        "Enter the event's start date or your nearest estimate. For example, when construction begins.",
    },
    endDate: {
      tooltip:
        "If known, enter the date the event ends. If unknown, enter a date when the advisory should be reviewed for relevance.",
    },
    displayedDate: {
      tooltip:
        "Select which date will be displayed on the advisory. The default is the 'posting date', but other date options are available.",
    },
    internalNotes: {
      tooltip:
        "Administrative notes that are not visible to the public. Can be useful for additional context for staff that is not in the advisory description.",
    },
    requestedBy: {
      tooltip:
        "Enter your name, or the name of the person who asked you to submit the advisory.",
    },
    listingRank: {
      tooltip:
        "Advisories are listed chronologically and by urgency by default. To change this, enter a number representing where you would like the advisory to appear in the list. For example, advisories with a higher number will appear first.",
    },
    publicSafetyRelated: {
      tooltip: "Check the box if visitor safety may be affected by the event.",
    },
  },
};
