import {
  faPencil,
  faMagnifyingGlass,
  faCalendar,
  faEye,
  faEyeSlash,
} from "@fa-kit/icons/classic/regular";

// ACT advisory/closure statuses
export const ACT_STATUS_MAP = new Map([
  [
    "DFT",
    {
      cssClass: "status-draft",
      displayText: "Draft",
      icon: faPencil,
    },
  ],
  [
    "UNP",
    {
      cssClass: "status-unpublished",
      displayText: "Unpublished",
      icon: faEyeSlash,
    },
  ],
  [
    "HQR",
    {
      cssClass: "status-hq-review",
      displayText: "HQ review",
      icon: faMagnifyingGlass,
    },
  ],
  [
    "SCH",
    {
      cssClass: "status-scheduled",
      displayText: "Scheduled",
      icon: faCalendar,
    },
  ],
  [
    "PUB",
    {
      cssClass: "status-published",
      displayText: "Published",
      icon: faEye,
    },
  ],
  ["ARCHIVED", { cssClass: "status-archived", displayText: "Archived" }],
]);
