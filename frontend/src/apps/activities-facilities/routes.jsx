import AccessControlledRoute from "@/router/AccessControlledRoute";
import ParkSearch from "./pages/ParkSearch";
import ParkInfo from "./pages/ParkInfo";

import { ROLES } from "@/config/permissions";

// Activities & Facilities routes, mounted under the "/" portal route
const activitiesFacilitiesRoutes = [
  {
    path: "activities-and-facilities",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.ADVISORY_APPROVER]}>
        <ParkSearch />
      </AccessControlledRoute>
    ),
  },
  {
    path: "/park-info/:id",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.ADVISORY_APPROVER]}>
        <ParkInfo />
      </AccessControlledRoute>
    ),
  },
];

export default activitiesFacilitiesRoutes;
