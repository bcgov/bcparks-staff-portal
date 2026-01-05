export const dateTypesData = [
  {
    name: "Backcountry registration",
    strapiDateTypeId: 8,
    description:
      "Enter dates when backcountry permit registration is required either online or at self-registration kiosks. If required year-round, enter Jan 1 to Dec 31.",
    level: ["feature", "parkArea"],
  },
  {
    name: "First come, first served",
    strapiDateTypeId: 9,
    description: "Dates when the campground is FCFS only.",
    level: ["parkArea"],
  },
  {
    name: "Full services and fees",
    strapiDateTypeId: 10,
    description: "The PO is operating and charging regular fees.",
    level: ["feature", "parkArea"],
  },
  {
    name: "Park gate open",
    strapiDateTypeId: 1,
    description:
      "Date range when the gate (or gates) is open and allows visitors to access the park by vehicle. If there are multiple gates, enter dates for the earliest gate opening and latest gate closing.",
    level: ["park"],
  },
  {
    name: "Operation",
    strapiDateTypeId: 6,
    description:
      "For areas managed by a park operator, this includes all dates when the PO is operating. For non-reservable backcountry and marine-access campgrounds, this includes all dates when camping is allowed, whether a PO is operating or not. For areas not managed by POs, this includes all times when the area is available for public use, and access is not blocked by a gate.",
    level: ["feature", "parkArea"],
  },
  {
    name: "Reservation",
    strapiDateTypeId: 7,
    description: "Enter dates when reservations are available.",
    level: ["feature"],
  },
  {
    name: "Tier 1",
    strapiDateTypeId: 2,
    description: "Enter dates when this park accepts same-day reservations.",
    level: ["park"],
  },
  {
    name: "Tier 2",
    strapiDateTypeId: 3,
    description:
      "Enter dates when this park requires reservations to be made two-days prior to arrival.",
    level: ["park"],
  },
  {
    name: "Winter fee",
    strapiDateTypeId: 4,
    description:
      "Enter dates when reduced winter fees are charged at any camground in this park.",
    level: ["park", "feature"],
  },
];
