import { createBrowserRouter } from "react-router-dom";
import ApiTest from "./pages/ApiTest";
import DatesManagement from "./pages/DatesManagement";
import PageDetails from "./pages/PageDetails";
import SubmitDates from "./pages/SubmitDates";
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
          element: <DatesManagement />,
        },

        // API endpoint test page
        {
          path: "/test",
          element: <ApiTest />,
        },

        // view park details
        {
          path: "/park/:parkId",
          element: <PageDetails />,
        },

        // edit/submit dates for a season
        {
          path: "/park/:parkId/edit/:seasonId",
          element: <SubmitDates />,
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
