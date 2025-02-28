import { createBrowserRouter } from "react-router-dom";
import EditAndReview from "./pages/EditAndReview";
import PublishPage from "./pages/PublishPage";
import ExportPage from "./pages/ExportPage";
import ParkDetails from "./pages/ParkDetails";
import SubmitDates from "./pages/SubmitDates";
import SubmitWinterFeesDates from "./pages/SubmitWinterFeesDates";
import PreviewChanges from "./pages/PreviewChanges";
import PreviewWinterFeesChanges from "./pages/PreviewWinterFeesChanges";
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

        // view park details
        {
          path: "/park/:parkId",
          element: <ParkDetails />,
        },

        // edit/submit dates for a season
        {
          path: "/park/:parkId/edit/:seasonId",
          element: <SubmitDates />,
        },

        // review changes
        {
          path: "/park/:parkId/edit/:seasonId/preview",
          element: <PreviewChanges />,
        },

        // edit/submit winter fees dates
        {
          path: "/park/:parkId/winter-fees/:seasonId/edit",
          element: <SubmitWinterFeesDates />,
        },

        // review winter fees dates
        {
          path: "/park/:parkId/winter-fees/:seasonId/preview",
          element: <PreviewWinterFeesChanges />,
        },
      ],
    },
  ],
  { basename: "/v2/" },
);

export default RouterConfig;
