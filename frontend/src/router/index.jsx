import { createBrowserRouter, Navigate } from "react-router-dom";

import AccessControlledRoute from "./AccessControlledRoute";
import EditAndReview from "./pages/EditAndReview";
import PublishPage from "./pages/PublishPage";
import ExportPage from "./pages/ExportPage";
import MainLayout from "./layouts/MainLayout";
import MainLayoutPublic from "./layouts/MainLayoutPublic";
import LandingPageTabs from "./layouts/LandingPageTabs";
import ErrorPage from "./pages/Error";
import LoginPage from "./pages/LoginPage";
import { Unauthorized } from "@/components/Unauthorized";

import { ErrorProvider } from "@/contexts/ErrorProvider";
import { CmsDataProvider } from "@/contexts/CmsDataProvider";
import AdvisoryDashboard from "./pages/advisories/advisoryDashboard/AdvisoryDashboard";
import ParkAccessStatus from "./pages/advisories/parkAccessStatus/ParkAccessStatus";
import ParkSearch from "./pages/advisories/parkSearch/ParkSearch";
import ParkInfo from "./pages/advisories/parkInfo/ParkInfo";
import Advisory from "./pages/advisories/advisory/Advisory";
import AdvisorySummary from "./pages/advisories/advisorySummary/AdvisorySummary";
import AdvisoryLink from "./pages/advisories/advisoryLink/AdvisoryLink";
import ProtectedRoute from "./ProtectedRoute";

import { ROLES } from "@/config/permissions";

const RouterConfig = createBrowserRouter([
  // Login page: will show login options with no sidebar,
  // or redirect to "/" if already authenticated.
  {
    path: "/login",
    element: <MainLayoutPublic />,
    children: [{ path: "", element: <LoginPage /> }],
  },

  // Root path - Advisories portal
  {
    path: "/",

    // Protect the entire route with the ProtectedRoute component
    element: (
      <ProtectedRoute>
        <ErrorProvider>
          <CmsDataProvider>
            <MainLayout />
          </CmsDataProvider>
        </ErrorProvider>
      </ProtectedRoute>
    ),

    children: [
      // "/" will redirect to "/advisories" if authenticated
      {
        path: "",
        element: <Navigate to="/advisories" replace />,
      },

      // Legacy staff portal error route
      // @TODO: use errorElement instead of setError with ErrorProvider
      {
        path: "error",
        element: <ErrorPage />,
      },

      // Public Advisories
      {
        path: "advisories",
        element: (
          <AccessControlledRoute
            allowedRoles={[ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER]}
          >
            <AdvisoryDashboard />
          </AccessControlledRoute>
        ),
      },
      {
        path: "/create-advisory",
        element: (
          <AccessControlledRoute
            allowedRoles={[ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER]}
          >
            <Advisory mode="create" />
          </AccessControlledRoute>
        ),
      },
      {
        path: "/advisory-summary/:documentId",
        element: (
          <AccessControlledRoute
            allowedRoles={[ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER]}
          >
            <AdvisorySummary />
          </AccessControlledRoute>
        ),
      },
      {
        path: "/update-advisory/:documentId",
        element: (
          <AccessControlledRoute
            allowedRoles={[ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER]}
          >
            <Advisory mode="update" />
          </AccessControlledRoute>
        ),
      },
      {
        path: "/advisory-link/:advisoryNumber",
        element: <AdvisoryLink />,
      },

      // Park Access Status
      {
        path: "park-access-status",
        element: (
          <AccessControlledRoute
            allowedRoles={[ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER]}
          >
            <ParkAccessStatus />
          </AccessControlledRoute>
        ),
      },

      // Activities & Facilities
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
    ],
  },

  // DOOT "Unauthorized" message for users without the doot user role in Keycloak
  {
    path: "/dates/unauthorized",
    element: <MainLayoutPublic />,
    children: [{ path: "", element: <Unauthorized /> }],
  },

  // /dates/ path - Dates of Operation Tool
  {
    path: "/dates/",

    // Protect the entire route with the ProtectedRoute component
    element: (
      <ProtectedRoute>
        <AccessControlledRoute
          redirectTo="/dates/unauthorized"
          allowedRoles={[ROLES.DOOT_USER]}
        >
          <MainLayout />
        </AccessControlledRoute>
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,

    children: [
      {
        path: "",
        // Tabbed navigation for the landing page
        element: <LandingPageTabs />,
        children: [
          // Edit & Review table / landing page
          {
            path: "",
            element: <EditAndReview />,
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
    ],
  },

  // Catch-all route for invalid paths
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default RouterConfig;
