import { Navigate } from "react-router-dom";

import AccessControlledRoute from "@/router/AccessControlledRoute";
import SubmitPage from "./pages/SubmitPage";
import EditPublishedPage from "./pages/EditPublishedPage";
import PublishPage from "./pages/PublishPage";
import ExportPage from "./pages/ExportPage";
import LandingPageTabs from "./components/LandingPageTabs";

import { ROLES } from "@/config/permissions";

// Dates of Operation Tool (DOOT) routes, mounted under the "/dates" portal route
const datesRoutes = [
  {
    path: "",
    // Tabbed navigation for the landing page
    element: <LandingPageTabs />,
    children: [
      // Redirect the section root to the canonical submit page
      {
        index: true,
        element: <Navigate to="submit" replace />,
      },

      // Dates editing/submission table landing page
      {
        path: "submit",
        element: <SubmitPage />,
      },

      // Edit season form route: opens the form panel over the submit page
      // (level is "park", "park-area", or "feature")
      {
        path: "edit/:level/:seasonId",
        element: <SubmitPage />,
      },

      // Edit published table / landing page
      {
        path: "edit-published",
        element: (
          <AccessControlledRoute allowedRoles={[ROLES.DOOT_APPROVER]}>
            <EditPublishedPage />
          </AccessControlledRoute>
        ),
      },

      // Export
      {
        path: "export",
        element: (
          <AccessControlledRoute allowedRoles={[ROLES.DOOT_APPROVER]}>
            <ExportPage />
          </AccessControlledRoute>
        ),
      },

      // Publish
      {
        path: "publish",
        element: (
          <AccessControlledRoute allowedRoles={[ROLES.DOOT_APPROVER]}>
            <PublishPage />
          </AccessControlledRoute>
        ),
      },
    ],
  },
];

export default datesRoutes;
