import { createBrowserRouter } from "react-router-dom";
import EditAndReview from "./pages/EditAndReview";
import PublishPage from "./pages/PublishPage";
import ExportPage from "./pages/ExportPage";
import ParkDetails from "./pages/ParkDetails";
import SeasonPage from "./pages/SeasonPage";
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

        // Season page with sub-routes
        {
          path: paths.season(":parkId", ":seasonId"),
          // element: <div>test foo</div>,
          element: <SeasonPage />,
          children: [
            // edit/submit dates for a season
            {
              path: "edit",
              element: <SubmitDates />,
            },

            // preview changes before saving
            {
              path: "preview",
              element: <PreviewChanges />,
            },
          ],
        },

        // @TODO: whatever we do above, do the same for winter fees

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
