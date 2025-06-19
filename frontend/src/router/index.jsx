import { createBrowserRouter } from "react-router-dom";
import EditAndReview from "./pages/EditAndReview";
import PublishPage from "./pages/PublishPage";
import ExportPage from "./pages/ExportPage";
import MainLayout from "./layouts/MainLayout";
import LandingPageTabs from "./layouts/LandingPageTabs";
import ErrorPage from "./pages/Error";

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
            // Export
            {
              path: "export",
              element: <ExportPage />,
            },
            // Publish
            {
              path: "publish",
              element: <PublishPage />,
            },
          ],
        },
      ],
    },
  ],
  {
    basename: "/v2/",

    // future flags: disable warnings about v7 changes
    future: {
      // eslint-disable-next-line camelcase -- vendor flag
      v7_relativeSplatPath: true,
    },
  },
);

export default RouterConfig;
