export const dateTypesData = [
  {
    name: "Backcountry registration",
    startDateLabel: "Backcountry registration start date",
    endDateLabel: "Backcountry registration end date",
    description:
      "Enter dates when backcountry permit registration is required either online or at self-registration kiosks. If required year-round, enter Jan 1 to Dec 31.",
    level: "feature",
  },
  {
    name: "First come, first served",
    startDateLabel: "First come first served start date",
    endDateLabel: "First come first served end date",
    description: "Dates when the campground is FCFS only.",
    level: "feature",
  },
  {
    name: "Full services and fees",
    startDateLabel: "Full services and fees start date",
    endDateLabel: "Full services and fees end date",
    description: "The PO is operating and charging regular fees.",
    level: "feature",
  },
  {
    name: "Operating",
    startDateLabel: "Operating start date",
    endDateLabel: "Operating end date",
    description:
      "If the park has a single gated entrance, these dates indicate when that gate is open. If there are multiple entrances, select 'No' above and leave this blank.",
    level: "park",
  },
  {
    name: "Operation",
    startDateLabel: "Service Start Date",
    endDateLabel: "Service End Date",
    description:
      "For areas managed by a park operator, this includes all dates when the PO is operating. For non-reservable backcountry and marine-access campgrounds, this includes all dates when camping is allowed, whether a PO is operating or not. For areas not managed by POs, this includes all times when the area is available for public use, and access is not blocked by a gate.",
    level: "feature",
  },
  {
    name: "Reservation",
    startDateLabel: "Reservation Start Date",
    endDateLabel: "Reservation End Date",
    description: "Enter dates when reservations are available.",
    level: "feature",
  },
  {
    name: "Tier 1",
    startDateLabel: "Tier 1 start date",
    endDateLabel: "Tier 1 end date",
    description: "Enter dates when this park accepts same-day reservations.",
    level: "park",
  },
  {
    name: "Tier 2",
    startDateLabel: "Tier 2 start date",
    endDateLabel: "Tier 2 end date",
    description:
      "Enter dates when this park requires reservations to be made two-days prior to arrival.",
    level: "park",
  },
  // "Winter fee" in the park level
  {
    name: "Winter fee",
    startDateLabel: "Winter fee start date",
    endDateLabel: "Winter fee end date",
    description:
      "Enter dates when reduced winter fees are charged at any camground in this park.",
    level: "park",
  },
  // "Winter fee" in the feature level - published "Winter fee" dates before July release has this date type
  {
    name: "Winter fee",
    startDateLabel: "Winter start date",
    endDateLabel: "Winter end date",
    description: "Reduced services and reduced legislated winter fees.",
    level: "feature",
  },
];
