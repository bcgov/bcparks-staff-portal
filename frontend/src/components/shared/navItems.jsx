import { NavLink } from "react-router-dom";
import {
  faBuilding,
  faCalendar,
  faDiamondExclamation,
  faDollarSign,
  faEnvelope,
  faFileExport,
  faLeaf,
  faTicket,
} from "@fa-kit/icons/classic/regular";
import { ROLES } from "@/config/permissions";

// Viewports that can fit the whole side nav, including quick links.
// Smaller viewports use the touch menu instead.
export const SIDEBAR_MEDIA_QUERY = "(min-width: 768px) and (min-height: 600px)";

const navItems = [
  {
    label: "Advisories and closures",
    icon: faDiamondExclamation,
    Tag: NavLink,
    to: "/advisories-and-closures",
    allowedRoles: [ROLES.ADVISORY_USER],
  },
  {
    label: "Dates management",
    icon: faCalendar,
    Tag: NavLink,
    to: "/dates",
    allowedRoles: [ROLES.DOOT_USER],
  },
  {
    label: "Activities and facilities",
    icon: faBuilding,
    Tag: NavLink,
    to: "/activities-and-facilities",
    allowedRoles: [ROLES.ADVISORY_APPROVER],
  },
  {
    label: "Park access status",
    icon: faFileExport,
    Tag: NavLink,
    to: "/park-access-status",
    allowedRoles: [ROLES.BCPARKS_USER],
    // Park operators don't have access to the park access status
    excludeParkOperators: true,
  },
];

// External links, shown to all users
export const quickLinks = [
  {
    label: "Attendance and Revenue",
    icon: faDollarSign,
    href: "https://attendance-revenue.bcparks.ca/",
    external: true,
  },
  {
    label: "Day-use Pass admin",
    icon: faTicket,
    href: "https://reserve-admin.bcparks.ca/dayuse/",
    external: true,
  },
  {
    label: "RecSpace",
    icon: faLeaf,
    href: "https://staff.sitesandtrailsbc.ca/",
    external: true,
  },
  {
    label: "Contact us",
    icon: faEnvelope,
    href: "mailto:cardweb@gov.bc.ca",
    external: false,
  },
];

export default navItems;
