import AccessControlledRoute from "@/router/AccessControlledRoute";
import AdvisoryDashboard from "./pages/AdvisoryDashboard";
import AdvisoryReviewDashboard from "./pages/AdvisoryReviewDashboard";
import Advisory from "./pages/Advisory";
import AdvisorySummary from "./pages/AdvisorySummary";
import AdvisoryLink from "./pages/AdvisoryLink";

import { ROLES } from "@/config/permissions";

// Advisory & Closure Tool (ACT) routes, mounted under the "/" portal route
const advisoriesRoutes = [
  // Advisories and closures - All
  {
    path: "advisories-and-closures",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.ADVISORY_USER]}>
        <AdvisoryDashboard />
      </AccessControlledRoute>
    ),
  },
  // Advisories and closures - Review
  {
    path: "advisories-and-closures/review",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.ADVISORY_APPROVER]}>
        <AdvisoryReviewDashboard />
      </AccessControlledRoute>
    ),
  },
  {
    path: "/create-advisory",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.ADVISORY_USER]}>
        <Advisory mode="create" />
      </AccessControlledRoute>
    ),
  },
  {
    path: "/advisory-summary/:documentId",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.ADVISORY_USER]}>
        <AdvisorySummary />
      </AccessControlledRoute>
    ),
  },
  {
    path: "/update-advisory/:documentId",
    element: (
      <AccessControlledRoute allowedRoles={[ROLES.ADVISORY_USER]}>
        <Advisory mode="update" />
      </AccessControlledRoute>
    ),
  },
  {
    path: "/advisory-link/:advisoryNumber",
    element: <AdvisoryLink />,
  },
];

export default advisoriesRoutes;
