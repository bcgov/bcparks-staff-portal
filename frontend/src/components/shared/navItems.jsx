import { NavLink } from "react-router-dom";
import { ROLES } from "@/config/permissions";

const navItems = [
  {
    label: "Advisories and closures",
    Tag: NavLink,
    to: "/advisories-and-closures",
    allowedRoles: [ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Park access status",
    Tag: NavLink,
    to: "/park-access-status",
    allowedRoles: [ROLES.BCPARKS_USER],
  },
  {
    label: "Activities and facilities",
    Tag: NavLink,
    to: "/activities-and-facilities",
    allowedRoles: [ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Dates management",
    Tag: NavLink,
    to: "/dates/",
    allowedRoles: [ROLES.DOOT_USER],
  },
];

export default navItems;
