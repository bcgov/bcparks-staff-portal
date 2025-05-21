// TODO: Add description to each date type

export const dateTypesData = [
  {
    name: "Tier 1",
    startDateLabel: "Tier 1 start date",
    endDateLabel: "Tier 1 end date",
    description: "",
    level: "park",
  },
  {
    name: "Tier 2",
    startDateLabel: "Tier 2 start date",
    endDateLabel: "Tier 2 end date",
    description: "",
    level: "park",
  },
  {
    name: "Operating",
    startDateLabel: "Operating start date",
    endDateLabel: "Operating end date",
    description: "",
    level: "park",
  },
  // "Winter fee" in the park level
  {
    name: "Winter fee",
    startDateLabel: "Winter fee start date",
    endDateLabel: "Winter fee end date",
    description: "",
    level: "park",
  },
  {
    name: "Operation",
    startDateLabel: "Service Start Date",
    endDateLabel: "Service End Date",
    description:
      "All nights where the area is open by the operator. Fees and service levels can vary depending on the time of year.",
    level: "feature",
  },
  {
    name: "Reservation",
    startDateLabel: "Reservation Start Date",
    endDateLabel: "Reservation End Date",
    description: "Dates where reservations are available.",
    level: "feature",
  },
  // "Winter fee" in the feature level - published "Winter fee" dates has this date type
  {
    name: "Winter fee",
    startDateLabel: "Winter start date",
    endDateLabel: "Winter end date",
    description: "Reduced services and reduced legislated winter fees.",
    level: "feature",
  },
  {
    name: "Backcountry registration",
    startDateLabel: "Backcountry registration start date",
    endDateLabel: "Backcountry registration end date",
    description: "",
    level: "feature",
  },
  {
    name: "Full services and fees",
    startDateLabel: "Full services and fees start date",
    endDateLabel: "Full services and fees end date",
    description: "",
    level: "feature",
  },
  {
    name: "First come, first served",
    startDateLabel: "First come first served start date",
    endDateLabel: "First come first served end date",
    description: "",
    level: "feature",
  }
];
