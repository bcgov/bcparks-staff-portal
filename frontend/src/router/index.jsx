import { createBrowserRouter, Navigate } from "react-router-dom";

import AccessControlledRoute from "./AccessControlledRoute";
// App routes are imported before the portal layouts to keep the existing CSS cascade order
import datesRoutes from "@/apps/dates/routes";
import LogoutPage from "./pages/LogoutPage";
import MainLayout from "./layouts/MainLayout";
import MainLayoutPublic from "./layouts/MainLayoutPublic";
import ErrorPage from "./pages/Error";
import LoginPage from "./pages/LoginPage";
import { Unauthorized } from "@/components/Unauthorized";

import { ErrorProvider } from "@/contexts/ErrorProvider";
import { CmsDataProvider } from "@/contexts/CmsDataProvider";
import ProtectedRoute from "./ProtectedRoute";

import advisoriesRoutes from "@/apps/advisories/routes";
import accessStatusRoutes from "@/apps/access-status/routes";
import activitiesFacilitiesRoutes from "@/apps/activities-facilities/routes";

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
      // "/" will redirect to "/advisories-and-closures" if authenticated
      {
        path: "",
        element: <Navigate to="/advisories-and-closures" replace />,
      },

      // Legacy staff portal error route
      {
        path: "error",
        element: <ErrorPage />,
      },

      {
        path: "logout",
        element: <LogoutPage />,
      },

      // Advisories and closures
      ...advisoriesRoutes,

      // Park Access Status
      ...accessStatusRoutes,

      // Activities & Facilities
      ...activitiesFacilitiesRoutes,
    ],
  },

  // "Unauthorized" message for users without portal group membership in Keycloak
  {
    path: "/unauthorized",
    element: <MainLayoutPublic />,
    children: [{ path: "", element: <Unauthorized /> }],
  },

  // /dates path - Dates of Operation Tool
  {
    path: "/dates",

    // Protect the entire route with the ProtectedRoute component
    element: (
      <ProtectedRoute>
        <AccessControlledRoute allowedRoles={[ROLES.DOOT_USER]}>
          <MainLayout />
        </AccessControlledRoute>
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,

    children: datesRoutes,
  },

  // Catch-all route for invalid paths
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default RouterConfig;
