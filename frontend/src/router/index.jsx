import { createBrowserRouter } from "react-router-dom";

import AccessControlledRoute from "./AccessControlledRoute";
import EditAndReview from "./pages/EditAndReview";
import EditPublishedPage from "./pages/EditPublishedPage";
import PublishPage from "./pages/PublishPage";
import ExportPage from "./pages/ExportPage";
import MainLayout from "./layouts/MainLayout";
import LandingPageTabs from "./layouts/LandingPageTabs";
import ErrorPage from "./pages/Error";
import LoginPage from "./pages/LoginPage";
import { ROLES } from "@/config/permissions";

const RouterConfig = createBrowserRouter(
  [
    {
      path: "/",
      // Protect the entire app with the AuthProvider
      element: <MainLayout />,
      errorElement: <ErrorPage />,

      children: [
        {
          path: "/",
          // Tabbed navigation for the landing page
          element: <LandingPageTabs />,
          children: [
            // Edit & Review table / landing page
            {
              path: "",
              element: <EditAndReview />,
            },
            // Edit season form routes
            {
              path: "edit/park/:seasonId",
              element: <EditAndReview />,
            },
            {
              path: "edit/park-area/:seasonId",
              element: <EditAndReview />,
            },
            {
              path: "edit/feature/:seasonId",
              element: <EditAndReview />,
            },
            // Edit published table / landing page
            {
              path: "edit-published",
              element: <EditPublishedPage />,
            },
            // Export
            {
              path: "export",
              element: (
                <AccessControlledRoute allowedRoles={[ROLES.APPROVER]}>
                  <ExportPage />
                </AccessControlledRoute>
              ),
            },
            // Publish
            {
              path: "publish",
              element: (
                <AccessControlledRoute allowedRoles={[ROLES.APPROVER]}>
                  <PublishPage />
                </AccessControlledRoute>
              ),
            },
          ],
        },
        {
          path: "/login",
          element: <LoginPage />,
        },
      ],
    },
  ],
  {
    basename: "/dates/",

    // future flags: disable warnings about v7 changes
    future: {
      // eslint-disable-next-line camelcase -- vendor flag
      v7_relativeSplatPath: true,
    },
  },
);

export default RouterConfig;
