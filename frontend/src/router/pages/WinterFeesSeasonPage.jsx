import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

import paths from "@/router/paths";
import { useApiGet } from "@/hooks/useApi";

import LoadingBar from "@/components/LoadingBar";

export default function WinterFeesSeasonPage() {
  // Render the SubmitWinterFeesDates (edit form) or PreviewWinterFeesChanges
  // (read-only) component based on the current route.
  // Provide the same date to either route and allow switching back and forth.

  const { parkId, seasonId } = useParams();
  const navigate = useNavigate();

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState(null);
  const [readyToPublish, setReadyToPublish] = useState(false);
  const [notes, setNotes] = useState("");

  // Track deleted date ranges
  const [deletedDateRangeIds, setDeletedDateRangeIds] = useState([]);

  const { data, loading, error } = useApiGet(`/winter-fees/${seasonId}`);

  useEffect(() => {
    if (!data) return;

    // Format the data for the page state: flatten the features
    const dateEntries = data.featureTypes.flatMap((featureType) =>
      // Create object entries with the dateable ID and date ranges
      featureType.features.map((feature) => [
        feature.dateableId,
        feature.currentWinterDates,
      ]),
    );

    // Group by dateable IDs
    const dateableGroups = Object.fromEntries(dateEntries);

    setSeason(data);
    setDates(dateableGroups);
    setReadyToPublish(data.readyToPublish);
  }, [data]);

  // Navigates to a new route and scrolls to the top of the page
  function navigateAndScroll(to) {
    navigate(to);
    window.scrollTo(0, 0);
  }

  async function saveAsDraft(saveFunction, openConfirmation, showErrorFlash) {
    try {
      if (["pending review", "approved", "on API"].includes(season.status)) {
        const confirm = await openConfirmation(
          "Move back to draft?",
          "The dates will be moved back to draft and need to be submitted again to be reviewed.",
          "Move to draft",
          "Cancel",
          "If dates have already been published, they will not be updated until new dates are submitted, approved, and published.",
        );

        if (!confirm) return;
      }

      await saveFunction();
      navigate(`${paths.park(parkId)}?saved=${seasonId}`);
    } catch (err) {
      console.error(err);

      // @TODO: Handle validation errors

      // Show a flash message for fatal server errors
      showErrorFlash();
    }
  }

  if (loading || !season) {
    return (
      <div className="container">
        <LoadingBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p>Error loading season data: {error.message}</p>
      </div>
    );
  }

  return (
    <Outlet
      context={{
        parkId,
        seasonId,
        season,
        dates,
        setDates,
        notes,
        setNotes,
        readyToPublish,
        setReadyToPublish,
        navigate,
        navigateAndScroll,
        deletedDateRangeIds,
        setDeletedDateRangeIds,
        saveAsDraft,
      }}
    />
  );
}
