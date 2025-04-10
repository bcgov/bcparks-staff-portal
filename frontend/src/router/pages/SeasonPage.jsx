import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { omit } from "lodash-es";

import paths from "@/router/paths";
import { useApiGet, useApiPost } from "@/hooks/useApi";
import useValidation from "@/hooks/useValidation";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";

import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";
import ConfirmationDialog from "@/components/ConfirmationDialog";

export default function SeasonPage() {
  // Render the SubmitDates (edit form) or PreviewDates (read-only) component
  // based on the current route. Provide the same date to either route
  // and allow switching back and forth.

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

  const validation = useValidation(dates, notes, season);

  const { data, loading, error } = useApiGet(`/seasons/${seasonId}`);

  const { sendData, loading: saving } = useApiPost(
    `/seasons/${seasonId}/save/`,
  );

  useEffect(() => {
    if (data) {
      const currentSeasonDates = {};

      data.campgrounds.forEach((campground) => {
        campground.features.forEach((feature) => {
          currentSeasonDates[feature.dateable.id] = {
            Operation: [],
            Reservation: [],
          };
          feature.dateable.currentSeasonDates.forEach((dateRange) => {
            currentSeasonDates[feature.dateable.id][
              dateRange.dateType.name
            ].push({
              ...dateRange,
              dateableId: feature.dateable.id,
              inputType: "text",
              changed: false,
            });
          });
        });
      });

      data.features.forEach((feature) => {
        currentSeasonDates[feature.dateable.id] = {
          Operation: [],
          Reservation: [],
        };
        feature.dateable.currentSeasonDates.forEach((dateRange) => {
          currentSeasonDates[feature.dateable.id][dateRange.dateType.name].push(
            {
              ...dateRange,
              dateableId: feature.dateable.id,
              inputType: "text",
              changed: false,
            },
          );
        });
      });

      setSeason(data);
      setDates(currentSeasonDates);
      setReadyToPublish(data.readyToPublish);
    }
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
    // Build a list of date ranges of all date types
    const allDates = Object.values(dates)
      .reduce(
        (acc, dateType) => acc.concat(dateType.Operation, dateType.Reservation),
        [],
      )
      // Filter out any blank ranges or unchanged dates
      .filter((dateRange) => {
        if (
          dateRange.startDate === null &&
          dateRange.endDate === null &&
          !dateRange.id
        ) {
          return false;
        }

        // if the range is unchanged, skip this range
        return dateRange.changed;
      })
      // Add dateTypeId to the date ranges, remove tempId
      .map((dateRange) => ({
        ...omit(dateRange, ["tempId"]),
        dateTypeId: dateRange.dateType.id,
      }));

    const payload = {
      notes,
      readyToPublish,
      dates: allDates,
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

      if (err instanceof validation.ValidationError) {
        // @TODO: Handle validation errors
        console.error(validation.errors);
      } else {
        // Show a flash message for fatal server errors
        showErrorFlash();
      }
    }
  }

  // Returns true if there are any form changes to save
  function hasChanges() {
    if (!dates) return false;

    // Any existing dates changed
    if (
      Object.values(dates).some((dateType) =>
        dateType.Operation.concat(dateType.Reservation).some(
          (dateRange) => dateRange.changed,
        ),
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
          validation,
          navigate,
          navigateAndScroll,
          setDeletedDateRangeIds,
          saveAsDraft,
          saveChanges,
          showErrorFlash,
          hasChanges,
          saving,
        }}
      />
    </>
  );
}
