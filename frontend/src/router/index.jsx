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
import paths from "./paths";

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
          path: paths.park(":parkId"),
          element: <ParkDetails />,
        },

        // edit/submit dates for a season
        {
          path: paths.seasonEdit(":parkId", ":seasonId"),
          element: <SubmitDates />,
        },

        // review changes
        {
          path: paths.seasonPreview(":parkId", ":seasonId"),
          element: <PreviewChanges />,
        },

        // edit/submit winter fees dates
        {
          path: paths.winterFeesEdit(":parkId", ":seasonId"),
          element: <SubmitWinterFeesDates />,
        },

        // review winter fees dates
        {
          path: paths.winterFeesPreview(":parkId", ":seasonId"),
          element: <PreviewWinterFeesChanges />,
        },
      ],
    },
  ],
  { basename: "/v2/" },
);

export default RouterConfig;
