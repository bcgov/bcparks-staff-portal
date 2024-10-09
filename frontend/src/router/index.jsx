import { createBrowserRouter } from "react-router-dom";
import ApiTest from "./pages/ApiTest";
import MainLayout from "./layouts/MainLayout";
import ErrorPage from "./pages/Error";
import ProtectedRoute from "./ProtectedRoute";

const RouterConfig = createBrowserRouter(
  [
    {
      path: "/",
      // Protect the entire app with the AuthProvider
      element: <ProtectedRoute component={MainLayout} />,
      errorElement: <ErrorPage />,
      children: [
        // dates management table / landing page
        {
          path: "/",
          element: <div>Dates management table page</div>,
        },

        // API endpoint test page
        {
          path: "/test",
          element: <ApiTest />,
        },

        // view park details
        {
          path: "/park/:parkId",
          element: <div>View park details page</div>,
        },

        // edit/submit dates for a season
        {
          path: "/park/:parkId/edit/:seasonId",
          element: <div>Edit/submit dates for a season</div>,
        },

        // review changes
        {
          path: "/park/:parkId/edit/:seasonId/review",
          element: <div>Review changes page</div>,
        },

        // publish
        {
          path: "/publish",
          element: <div>Publish page</div>,
        },

        // lock
        {
          path: "/lock",
          element: <div>Lock page</div>,
        },

        // export
        {
          path: "/export",
          element: <div>Export page</div>,
        },
      ],
    },
  ],
  { basename: "/v2/" },
);

export default RouterConfig;
