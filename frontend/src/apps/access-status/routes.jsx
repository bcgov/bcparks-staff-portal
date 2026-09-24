import AccessControlledRoute from "@/router/AccessControlledRoute";
import ParkAccessStatus from "./pages/ParkAccessStatus";

import { ROLES } from "@/config/permissions";

// Park Access Status routes, mounted under the "/" portal route
const accessStatusRoutes = [
  {
    path: "park-access-status",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.BCPARKS_USER]}>
        <ParkAccessStatus />
      </AccessControlledRoute>
    ),
  },
];

export default accessStatusRoutes;
