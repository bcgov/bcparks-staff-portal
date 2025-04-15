import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { omit } from "lodash-es";

import paths from "@/router/paths";
import { useApiGet, useApiPost } from "@/hooks/useApi";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";

import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";
import ConfirmationDialog from "@/components/ConfirmationDialog";

export default function WinterFeesSeasonPage() {
  // Render the SubmitWinterFeesDates (edit form) or PreviewWinterFeesChanges
  // (read-only) component based on the current route.
  // Provide the same date to either route and allow switching back and forth.

  const { parkId, seasonId } = useParams();
  const navigate = useNavigate();
  const errorFlashMessage = useFlashMessage();
  const confirmationDialog = useConfirmation();

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState(null);
  const [readyToPublish, setReadyToPublish] = useState(false);
  const [notes, setNotes] = useState("");

  // Track deleted date ranges
  const [deletedDateRangeIds, setDeletedDateRangeIds] = useState([]);

  const { data, loading, error } = useApiGet(`/winter-fees/${seasonId}`);

  const { sendData, loading: saving } = useApiPost(
    `/seasons/${seasonId}/save/`,
  );

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

  // Navigates to a new route and scrolls to an anchor, or the top of the page
  function navigateAndScroll(to, anchorId) {
    navigate({
      pathname: to,
      hash: anchorId && `#${anchorId}`,
    });

    if (anchorId) {
      // Wait for the component to render before scrolling
      setTimeout(() => {
        const anchor = document.getElementById(anchorId);

        // Scroll to the anchor, if it exists
        anchor?.scrollIntoView();
      }, 150);
    } else {
      // Scroll to the top of the page
      window.scrollTo(0, 0);
    }
  }

  async function saveChanges() {
    // @TODO: Validate form state before saving

    // Turn the `dates` structure into a flat array of date ranges
    const flattenedDates = Object.entries(dates).flatMap(
      ([dateableId, dateRanges]) =>
        // Add foreign keys to the date ranges, remove tempId
        dateRanges.map((dateRange) => ({
          ...omit(dateRange, ["tempId"]),
          dateableId: Number(dateableId),
          dateTypeId: season.winterFeeDateType.id,
          seasonId,
        })),
    );

    // Filter out unchanged or empty date ranges
    const changedDates = flattenedDates.filter((dateRange) => {
      // if both dates are null and it has no ID, skip this range
      if (
        dateRange.startDate === null &&
        dateRange.endDate === null &&
        !dateRange.id
      ) {
        return false;
      }

      // if the range is unchanged, skip this range
      return dateRange.changed;
    });

    const payload = {
      notes,
      readyToPublish,
      dates: changedDates,
      deletedDateRangeIds,
    };

    const response = await sendData(payload);

    return response;
  }

  function showErrorFlash() {
    errorFlashMessage.openFlashMessage(
      "Unable to save changes",
      "There was a problem saving these changes. Please try again.",
    );
  }

  async function saveAsDraft() {
    try {
      if (["pending review", "approved", "on API"].includes(season.status)) {
        const confirm = await confirmationDialog.openConfirmation(
          "Move back to draft?",
          "The dates will be moved back to draft and need to be submitted again to be reviewed.",
          "Move to draft",
          "Cancel",
          "If dates have already been published, they will not be updated until new dates are submitted, approved, and published.",
        );

        if (!confirm) return;
      }

      await saveChanges();
      navigate(`${paths.park(parkId)}?saved=${seasonId}`);
    } catch (err) {
      console.error(err);

      // @TODO: Handle validation errors

      // Show a flash message for fatal server errors
      showErrorFlash();
    }
  }

  // Returns true if there are any form changes to save
  function hasChanges() {
    // Any existing dates changed
    if (
      Object.values(dates).some((dateRanges) =>
        dateRanges.some((dateRange) => dateRange.changed),
      )
    ) {
      return true;
    }

    // If any date ranges have been deleted
    if (deletedDateRangeIds.length > 0) return true;

    // Ready to publish state has changed
    if (readyToPublish !== season.readyToPublish) return true;

    // Notes have been entered
    return notes;
  }

  useNavigationGuard(hasChanges, confirmationDialog.openConfirmation);

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
    <>
      <FlashMessage
        title={errorFlashMessage.flashTitle}
        message={errorFlashMessage.flashMessage}
        isVisible={errorFlashMessage.isFlashOpen}
        onClose={errorFlashMessage.handleFlashClose}
        variant="error"
      />

      <ConfirmationDialog
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmButtonText={confirmationDialog.confirmButtonText}
        cancelButtonText={confirmationDialog.cancelButtonText}
        notes={confirmationDialog.confirmationDialogNotes}
        onCancel={confirmationDialog.handleCancel}
        onConfirm={confirmationDialog.handleConfirm}
        isOpen={confirmationDialog.isConfirmationOpen}
      />

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
          setDeletedDateRangeIds,
          saveAsDraft,
          saveChanges,
          saving,
          hasChanges,
          showErrorFlash,
        }}
      />
    </>
  );
}
