import { Link } from "react-router-dom";
import { ROLES } from "@/config/permissions";

const navItems = [
  {
    label: "Advisories",
    Tag: "a",
    href: "/advisories",
    allowedRoles: [ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Park Access Status",
    Tag: "a",
    href: "/park-access-status",
    allowedRoles: [ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Activities & Facilities",
    Tag: "a",
    href: "/activities-and-facilities",
    allowedRoles: [ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Dates of Operation",
    Tag: Link,
    to: "/",
    active: true,
    allowedRoles: [ROLES.DOOT_USER],
  },
];

export default navItems;