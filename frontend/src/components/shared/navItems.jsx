import { NavLink } from "react-router-dom";
import { ROLES } from "@/config/permissions";

const navItems = [
  {
    label: "Advisories",
    Tag: NavLink,
    to: "/advisories",
    allowedRoles: [ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Park Access Status",
    Tag: NavLink,
    to: "/park-access-status",
    allowedRoles: [ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Activities & Facilities",
    Tag: NavLink,
    to: "/activities-and-facilities",
    allowedRoles: [ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Dates of Operation",
    Tag: NavLink,
    to: "/dates/",
    allowedRoles: [ROLES.DOOT_USER],
  },
];

export default navItems;
