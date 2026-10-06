import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";
import { isEqual, omit, keyBy } from "lodash-es";

import FeatureIcon from "@/apps/dates/components/FeatureIcon";
import InternalNotes from "@/apps/dates/components/InternalNotes";
import LoadingBar from "@/components/LoadingBar";
import LastUpdatedInfo from "@/apps/dates/components/LastUpdatedInfo";
import OperatingYearSelect from "@/apps/dates/components/OperatingYearSelect";
import ParkSeasonForm from "@/apps/dates/components/SeasonForms/ParkSeasonForm";
import AreaSeasonForm from "@/apps/dates/components/SeasonForms/AreaSeasonForm";
import FeatureSeasonForm from "@/apps/dates/components/SeasonForms/FeatureSeasonForm";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import ErrorSummary from "@/apps/dates/components/FormErrorSummary";
import StatusBadge from "@/components/StatusBadge";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import useAccess from "@/hooks/useAccess";
import useConfirmation from "@/hooks/useConfirmation";
import useNavigationGuard from "@/hooks/useNavigationGuard";
import useValidation, {
  ValidationContext,
} from "@/apps/dates/hooks/useValidation/useValidation";
import DataContext from "@/apps/dates/contexts/DataContext";
import globalFlashMessageContext from "@/contexts/FlashMessageContext";
import * as STATUS from "@/constants/seasonStatus";
import * as SEASON_TYPE from "@/apps/dates/constants/seasonType";
import { findNextForm } from "@/apps/dates/utils/getEditableFormList";
import "./FormPanel.scss";

// Components

function ButtonLoading({ show }) {
  if (show) {
    return (
      <span
        className="spinner-border spinner-border-sm me-1"
        role="status"
        aria-hidden="true"
      ></span>
    );
  }

  return null;
}

ButtonLoading.propTypes = {
  show: PropTypes.bool.isRequired,
};

function Buttons({
  onSave,
  onSaveAndContinue,
  onSubmit,
  onApprove,
  approver,
  submitter,
  parkOperator = false,
  loading = false,
  disableDraftButton = false,
  disablePrimaryActionButton = false,
  continueToNext = false,
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onSave}
        className="btn btn-outline-primary form-btn fw-bold me-3"
        disabled={loading || disableDraftButton}
      >
        Save draft
      </button>

      {/* Show the Save draft and continue button for park operators when continuing to the next form */}
      {parkOperator && continueToNext && (
        <button
          type="button"
          onClick={onSaveAndContinue}
          className="btn btn-primary form-btn fw-bold me-2"
          disabled={loading || disableDraftButton}
        >
          Save draft and continue
        </button>
      )}

      {/* Show the Approve button for users with the approver role */}
      {approver && (
        <button
          type="button"
          onClick={onApprove}
          className="btn btn-primary form-btn fw-bold me-2"
          disabled={loading || disablePrimaryActionButton}
        >
          {continueToNext ? "Mark approved and continue" : "Mark approved"}
        </button>
      )}

      {/* Show the Submit button for submitters, but hide it for approvers */}
      {submitter && !approver && (
        <button
          type="button"
          onClick={onSubmit}
          className="btn btn-primary form-btn fw-bold me-2"
          disabled={loading || disablePrimaryActionButton}
        >
          {continueToNext ? "Submit to HQ and continue" : "Submit to HQ"}
        </button>
      )}

      {/* Show one loader for any loading state */}
      <ButtonLoading show={loading} />
    </div>
  );
}

Buttons.propTypes = {
  onSave: PropTypes.func.isRequired,
  onSaveAndContinue: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  approver: PropTypes.bool.isRequired,
  submitter: PropTypes.bool.isRequired,
  parkOperator: PropTypes.bool,
  loading: PropTypes.bool,
  disableDraftButton: PropTypes.bool,
  disablePrimaryActionButton: PropTypes.bool,
  continueToNext: PropTypes.bool,
};

function SeasonForm({
  seasonId,
  level,
  showOperatingYearSelect = false,
  onSeasonChange,
  closePanel,
  handleStatusCancelClose,
  onDataUpdate,
  dataChanged,
  setDataChanged,
  modal,
  registerSaveDraftHandler,
  showContinueOption = false,
  continueToNext = false,
  hasNextForm = false,
  setContinueToNext,
  nextForm = null,
  openNextForm,
}) {
  // Global flash message context
  const flashMessage = useContext(globalFlashMessageContext);

  // Hooks
  const { ROLES, checkAccess } = useAccess();
  const approver = checkAccess(ROLES.DOOT_APPROVER);
  const submitter = checkAccess(ROLES.DOOT_SUBMITTER);
  // Park operators are contributors who aren't also submitters or approvers.
  const parkOperator =
    checkAccess(ROLES.DOOT_CONTRIBUTOR) && !approver && !submitter;

  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [deletedDateRangeIds, setDeletedDateRangeIds] = useState([]);
  const [submitWithErrors, setSubmitWithErrors] = useState(false);
  const hasShownStatusPrompt = useRef(false);

  // Determine if the user is editing a published season (i.e., the "Edit published dates" page)
  const isEditingPublishedSeason = showOperatingYearSelect;

  // Reset status prompt tracking when switching to a different season form.
  useEffect(() => {
    hasShownStatusPrompt.current = false;
  }, [seasonId, level]);

  // Determine if the user is allowed to bypass validation errors and submit/approve the form
  const allowSubmitWithErrors = useMemo(() => {
    // Return false if the user is not an approver or submitter
    if (!approver && !submitter) return false;

    // Return false if the user hasn't provided any notes
    if (!notes.trim()) return false;

    // Return true if the "Submit with errors" checkbox is checked
    if (submitWithErrors) return true;

    return false;
  }, [approver, submitter, submitWithErrors, notes]);

  // Track form submission state: run more validation rules after the first submit
  const [submitted, setSubmitted] = useState(false);
  const validationContext = useMemo(
    () => ({ level, notes, submitted }),
    [level, notes, submitted],
  );
  const validation = useValidation(data, validationContext);

  const INTERNAL_NOTES_ERROR_ID = validation.elements.INTERNAL_NOTES.id;

  // Show validation summary only after submit/approve attempts.
  const shouldShowErrorSummary = useMemo(() => {
    if (!submitted) return false;

    return validation.errors.length > 0;
  }, [submitted, validation.errors]);

  // Controls the "Submit anyway"
  // Only show it when there are errors beyond internal notes
  const shouldShowSubmitAnyway = useMemo(() => {
    if (!shouldShowErrorSummary) return false;

    return validation.errors.some(
      (error) => error.id !== INTERNAL_NOTES_ERROR_ID,
    );
  }, [shouldShowErrorSummary, validation.errors, INTERNAL_NOTES_ERROR_ID]);

  const { sendData: sendSave, loading: sendingSave } = useApiPost(
    `/seasons/${seasonId}/save/`,
  );

  const {
    data: apiData,
    loading,
    error,
    fetchData: refreshData,
  } = useApiGet(`/seasons/${level}/${seasonId}`);

  const { data: seasonOptionsData, loading: loadingSeasonOptions } = useApiGet(
    `/seasons/options/${seasonId}`,
    { instant: showOperatingYearSelect },
  );

  const seasonOptions = useMemo(
    () => seasonOptionsData?.seasons ?? [],
    [seasonOptionsData],
  );

  // Initialize the form data when the API data is loaded
  useEffect(() => {
    if (apiData) {
      // if the season if from a previous year then the user must be in the
      // approver role to edit it. If not, close the form panel.
      if (
        apiData.current.operatingYear < new Date().getFullYear() &&
        !approver
      ) {
        closePanel();
        return;
      }

      if (apiData.current.savedWithErrors) {
        // Set the "submitted" flag to true, so the full form validation will run
        // and re-validate on every change.
        setSubmitted(true);
      } else {
        // If loading new data, reset the submitted state to false.
        setSubmitted(false);
      }

      setData(apiData);
    }
  }, [apiData, approver, closePanel]);

  // Constants
  const {
    current: season,
    previous: previousSeasonDates,
    currentWinter: winterSeason,
    previousWinter: previousWinterSeasonDates,
    ...seasonMetadata
  } = data || {};

  // Show a team's icon when its approval is required,
  // or when that team has already approved even though it wasn't required
  // (e.g. an IS approver approving a winter fee season, which only requires RS approval).
  const informationSvcApproved =
    approver &&
    (season?.requiresInformationSvcApproval || season?.informationSvcApproved)
      ? season.informationSvcApproved
      : null;
  const reservationSvcApproved =
    approver &&
    (season?.requiresReservationSvcApproval || season?.reservationSvcApproved)
      ? season.reservationSvcApproved
      : null;

  // Check season status and prompt user if needed (e.g., editing approved or published seasons)
  useEffect(() => {
    if (!season || hasShownStatusPrompt.current) return;

    async function checkStatusAndPrompt() {
      hasShownStatusPrompt.current = true;

      if (season.status === "approved") {
        const proceed = await modal.open({
          title: "Edit approved dates?",
          message:
            "Dates will need to be reviewed again to be approved. If reservations are already open, reservations may be affected.",
          confirmButtonText: "Edit",
          cancelButtonText: "Cancel",
        });

        if (!proceed) {
          handleStatusCancelClose();
        }
      } else if (season.status === "published") {
        const proceed = await modal.open({
          title: "Edit published dates?",
          message:
            "Dates will need to be reviewed again to be approved and published. If reservations are already open, reservations may be affected.",
          confirmButtonText: "Edit",
          cancelButtonText: "Cancel",
        });

        if (!proceed) {
          handleStatusCancelClose();
        }
      }
    }

    checkStatusAndPrompt();
  }, [season?.status, modal, handleStatusCancelClose, season]);

  // Derive the header text from the season data
  const yearHeaderText = useMemo(() => {
    // operatingYear is always defined for a Season, so data is still loading if it's undefined
    if (!season?.operatingYear) return "";

    const operatingYear = season.operatingYear;
    const nextYear = operatingYear + 1;

    const isWinterSeason = season.seasonType === SEASON_TYPE.WINTER;

    if (season.datesCanSpan2Years || isWinterSeason) {
      return `${operatingYear} – ${nextYear} dates`;
    }

    // Default: operating year
    return `${operatingYear} dates`;
  }, [season?.datesCanSpan2Years, season?.operatingYear, season?.seasonType]);

  const seasonTitle = useMemo(() => {
    // Return blank while loading
    if (!season || !seasonMetadata) return "";

    let title;
    const isWinterSeason = season.seasonType === SEASON_TYPE.WINTER;

    // For Park-level seasons, return the park name
    if (level === "park") {
      title = season.park.name;
      if (isWinterSeason) {
        title += ": winter fee";
      } else {
        title += ": tiers and gate";
      }
    } else {
      // For Area/Feature-level seasons,
      // Return Park and Area/Feature name
      title = `${seasonMetadata.parkName} - ${seasonMetadata.name}`;
    }
    return title;
  }, [level, season, seasonMetadata]);

  const dateTypesByStrapiId = useMemo(
    () => keyBy(seasonMetadata?.dateTypes || [], "dateTypeNumber"),
    [seasonMetadata],
  );
  // Find the "Park gate open" date type id
  const gateTypeId = dateTypesByStrapiId[1]?.id;

  // Build a map of Dateable IDs to their Feature names, for display in the Error Summary
  const dateableNames = useMemo(() => {
    if (!season) return new Map();

    // For ParkArea-level forms, we need to translate Dateable IDs to names for each Feature in the area
    if (level === "park-area") {
      return new Map(
        season.parkArea.features.map(({ dateableId, name }) => [
          dateableId,
          name,
        ]),
      );
    }

    // For Feature-level forms, we only need the Feature itself, so return a map with one entry
    if (level === "feature") {
      return new Map([[season.feature.dateableId, season.feature.name]]);
    }

    // For Park-level forms, we don't need to translate Dateable IDs to names, so return an empty map
    return new Map();
  }, [level, season]);

  // Determine if this is a ParkArea-level form with multiple features.
  // This affects the content of the Error Summary component.
  const multipleFeatures = useMemo(() => {
    // Return false if the season data isn't loaded or if it's not an applicable parkArea form
    if (level !== "park-area" || !season?.parkArea?.features) return false;

    return season.parkArea.features.length > 1;
  }, [level, season]);

  // Clears and re-fetches the data
  function resetData() {
    setData(null);

    // Refresh the data from the API
    refreshData();
  }

  // Track deleted date range IDs
  const addDeletedDateRangeId = useCallback((id) => {
    setDeletedDateRangeIds((prev) => [...prev, id]);
  }, []);

  // Memoize the updated data for saving or detecting changes
  const changesPayload = useMemo(() => {
    if (!season) return null;

    // Format the data for the API
    const seasonDateRanges = [];

    if (level === "park") {
      seasonDateRanges.push(...season.park.dateable.dateRanges);
    } else if (level === "feature") {
      seasonDateRanges.push(...season.feature.dateable.dateRanges);
    } else if (level === "park-area") {
      // Area-level dates
      const areaDateRanges = season.parkArea.dateable.dateRanges;

      // Feature-level dates within the area
      const featureDateRanges = season.parkArea.features.flatMap(
        (feature) => feature.dateable.dateRanges,
      );

      // Combine area and feature date ranges
      seasonDateRanges.push(...areaDateRanges, ...featureDateRanges);
    }

    let gateDetail = season.gateDetail;
    let filteredDateRanges = seasonDateRanges;
    let deletedOperatingIds = [];

    // Remove the "Park gate open" date ranges at park level if hasGate is false
    if (level === "park" && gateDetail && gateDetail.hasGate === false) {
      deletedOperatingIds = seasonDateRanges
        .filter(
          (dateRange) => dateRange.dateTypeId === gateTypeId && dateRange.id,
        )
        .map((dateRange) => dateRange.id);

      filteredDateRanges = seasonDateRanges.filter(
        (dateRange) => dateRange.dateTypeId !== gateTypeId,
      );
    }

    // Merge deletedDateRangeIds with deletedOperatingIds
    const allDeletedIds = [...deletedDateRangeIds, ...deletedOperatingIds];

    const changedDateRanges = filteredDateRanges
      .filter((range) => range.changed)
      // We only need the dateTypeId, drop fields we don't need to send
      .map((range) => omit(range, ["changed", "dateType"]));

    // The "Dates are the same every year" checkbox is hidden on the Edit Published tab,
    // so never send dateRangeAnnuals changes from that form.
    const changedDateRangeAnnuals = isEditingPublishedSeason
      ? []
      : season.dateRangeAnnuals.filter(
          (dateRangeAnnual) => dateRangeAnnual.changed,
        );

    // Clear gateDetail if hasGate is false
    if (gateDetail && gateDetail.hasGate === false) {
      gateDetail = {
        id: gateDetail.id,
        hasGate: false,
        gateOpenTime: null,
        gateCloseTime: null,
        gateOpensAtDawn: false,
        gateClosesAtDusk: false,
      };
    }

    // Determine if this is a winter season based on seasonType
    const isWinterSeason = season.seasonType === SEASON_TYPE.WINTER;

    const payload = {
      dateRanges: changedDateRanges,
      deletedDateRangeIds: allDeletedIds,
      dateRangeAnnuals: changedDateRangeAnnuals,
      gateDetail: isWinterSeason ? null : gateDetail,
      readyToPublish: season.readyToPublish,
      status: season.status,
      notes,
    };

    return payload;
  }, [
    level,
    season,
    deletedDateRangeIds,
    notes,
    gateTypeId,
    isEditingPublishedSeason,
  ]);

  // Calculate if the form data has changed, and sync the result to the parent via setDataChanged.
  // Once true, dataChanged stays true for the rest of the form's lifecycle (until new data loads).
  useEffect(() => {
    if (!season) {
      setDataChanged(false);
      return;
    }

    // Skip further checks if dataChanged is already true
    if (dataChanged) return;

    // True if date ranges were updated
    if (changesPayload.dateRanges.length) {
      setDataChanged(true);
      return;
    }

    // True if date ranges were deleted
    if (changesPayload.deletedDateRangeIds.length) {
      setDataChanged(true);
      return;
    }

    // True if readyToPublish changed
    if (changesPayload.readyToPublish !== apiData?.current?.readyToPublish) {
      setDataChanged(true);
      return;
    }

    // True if any date annuals were updated
    if (changesPayload.dateRangeAnnuals.length) {
      setDataChanged(true);
      return;
    }

    // True if any gateDetail values changed (for regular seasons)
    if (
      season.seasonType === SEASON_TYPE.REGULAR &&
      !isEqual(changesPayload.gateDetail, apiData?.current?.gateDetail)
    ) {
      setDataChanged(true);
      return;
    }

    // True if notes are entered
    if (changesPayload.notes.length > 0) {
      setDataChanged(true);
    }
  }, [season, changesPayload, apiData, dataChanged, setDataChanged]);

  // Primary action button is disabled in "Edit published seasons" mode when the form has no changes.
  // Primary action button is always enabled on regular season forms.
  const disablePrimaryActionButton = isEditingPublishedSeason && !dataChanged;

  // Save draft always disabled in "Edit published seasons" mode.
  // Save draft is disabled on regular season forms when the form has no changes.
  const disableDraftButton = isEditingPublishedSeason || !dataChanged;

  /**
   * Saves the form data to the DB.
   * @param {boolean} allowInvalid Allows saving even if the form has validation errors.
   * @param {string} status Status to set for the season.
   * @param {boolean} [resetAfterSave=true] Reset form state and refresh season data after saving.
   * @returns {Promise<object>} API response from the save request.
   * @throws {Error} When validation fails and invalid saves are not allowed.
   */
  async function saveForm(allowInvalid, status, resetAfterSave = true) {
    // saveForm is called on any kind of form submission, so validation happens here
    // If the form is submitted by some other means, call the validation function there too.

    // Only flag the form as submitted (to show the error summary) when validation can block the save.
    // If allowInvalid, the save goes ahead regardless, and the form either closes or reloads its data
    // (which resets the submitted state), so setting it here would cause an unnecessary re-render.
    if (!allowInvalid) {
      setSubmitted(true);
    }

    // Validate the form before saving, to catch any errors that would block the save.
    const validationErrors = validation.validateForm();

    if (validationErrors.length && !allowInvalid) {
      // Scroll the Error Summary component into view at the top of the form
      const errorSummaryElement = document.getElementById("validation-errors");

      if (errorSummaryElement) {
        errorSummaryElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      // If there are validation errors and we're not allowing invalid saves, stop here
      throw new Error(
        `Validation failed with ${validationErrors.length} errors`,
      );
    }

    // Clone the payload, and override the status with the provided value.
    const payload = { ...changesPayload, status };

    // Update isDateRangeAnnual for "Park gate open" date if gateDetail.hasGate is false.
    // Skip this on the Edit Published tab, since dateRangeAnnuals are never sent from there.
    if (
      !isEditingPublishedSeason &&
      payload.gateDetail &&
      payload.gateDetail.hasGate === false &&
      Array.isArray(season.dateRangeAnnuals)
    ) {
      payload.dateRangeAnnuals = season.dateRangeAnnuals
        .map((annual) => {
          if (gateTypeId && annual.dateType.id === gateTypeId) {
            return {
              ...annual,
              isDateRangeAnnual: false,
              changed: true,
            };
          }
          return annual;
        })
        .filter(
          (annual) =>
            annual.changed ||
            season.dateRangeAnnuals.some(
              (original) => original.id === annual.id && original.changed,
            ),
        );
    }

    // Send the value of the "Submit with validation errors" checkbox to the API
    // Always send false for drafts, since drafts can always be saved with errors
    payload.savedWithErrors =
      status !== STATUS.REQUESTED.value &&
      allowInvalid &&
      validationErrors.length > 0;

    try {
      // Send the save request to the API
      const response = await sendSave(payload);

      // Start refreshing the main page data from the API
      onDataUpdate();

      if (resetAfterSave) {
        // Re-fetch the season data from the API
        resetData();

        // Reset the form state
        setNotes("");
        setDeletedDateRangeIds([]);
        setSubmitWithErrors(false);
      }

      return response;
    } catch (saveError) {
      console.error("Error saving season:", saveError);
      throw saveError;
    }
  }

  /**
   * Saves the form as a draft. If the season is not "requested" (e.g. it is submitted, approved, or published),
   * prompts the user to confirm moving back to draft first.
   * @param {boolean} [continueAfterSave=false] Open the next form after saving (park operators' "Save draft and continue")
   * @returns {Promise<boolean>} True if the draft was saved, false if cancelled or the save failed
   */
  async function promptAndSave(continueAfterSave = false) {
    // Keep the next form from before saving, since the table data will refresh after saving
    const formToOpen = continueAfterSave ? nextForm : null;

    if (season.status !== STATUS.REQUESTED.value) {
      const proceed = await modal.open({
        title: "Move back to draft?",
        message:
          "The dates will be moved back to draft and need to be submitted again to be reviewed. If dates have already been published, they will not be updated until new dates are submitted, approved, and published.",
        confirmButtonText: "Move to draft",
        cancelButtonText: "Cancel",
      });

      // If the user cancels in the confirmation modal, don't close the edit form
      if (!proceed) {
        return false;
      }
    }

    try {
      // Save draft, and allow saving with validation errors.
      // Don't reset the form data when continuing, because the next form will replace it
      await saveForm(true, STATUS.REQUESTED.value, !formToOpen);

      flashMessage.open(
        "Dates saved as draft",
        `${seasonTitle} ${season.operatingYear} details saved`,
      );

      if (formToOpen) {
        openNextForm(formToOpen);
      }

      return true;
    } catch (saveError) {
      console.error("Error saving season as draft:", saveError);
      flashMessage.open(
        "Could not save dates as a draft",
        "Please try again.",
        { variant: "error" },
      );
      return false;
    }
  }

  // Keep the latest save-draft function in a ref so the registered handler never goes stale
  const saveDraftHandlerRef = useRef(promptAndSave);

  saveDraftHandlerRef.current = promptAndSave;

  useEffect(() => {
    // Parent can call this when the "Unsaved changes" dialog chooses "Save draft".
    // Drafts can't be saved in "Edit published seasons" mode, so register nothing.
    registerSaveDraftHandler(
      isEditingPublishedSeason
        ? null
        : async () => saveDraftHandlerRef.current(),
    );

    return () => registerSaveDraftHandler(null);
  }, [registerSaveDraftHandler, isEditingPublishedSeason]);

  async function onApprove() {
    // Keep the next form from before saving, since the table data will refresh after saving
    const formToOpen = continueToNext ? nextForm : null;

    try {
      // Save and update status, bypassing validation errors if the user has checked the "Submit with errors" checkbox
      // Don't reset the form data after saving, because the panel will close
      const response = await saveForm(
        allowSubmitWithErrors,
        STATUS.APPROVED.value,
        false,
      );

      // This occurs when one required approval has been recorded,
      // but another required team approval is still missing.
      if (response.status !== STATUS.APPROVED.value) {
        flashMessage.open(
          "Approval recorded",
          `${seasonTitle} ${season.operatingYear} approval recorded; dates are still pending HQ review`,
        );

        if (formToOpen) {
          openNextForm(formToOpen);
          return;
        }

        resetData();
        setNotes("");
        setDeletedDateRangeIds([]);
        setSubmitWithErrors(false);
        setDataChanged(false);
        return;
      }

      flashMessage.open(
        "Dates approved",
        `${seasonTitle} ${season.operatingYear} dates marked as approved`,
      );

      if (formToOpen) {
        openNextForm(formToOpen);
        return;
      }

      closePanel();
    } catch (saveError) {
      console.error("Error approving season:", saveError);
      flashMessage.open(
        "Could not approve dates",
        "Please try again.",
        { variant: "error" },
      );
    }
  }

  async function onSubmit() {
    // Keep the next form from before saving, since the table data will refresh after saving
    const formToOpen = continueToNext ? nextForm : null;

    try {
      // Save and update status, bypassing validation errors if the user has checked the "Submit with errors" checkbox
      // Don't reset the form data after saving, because the panel will close
      await saveForm(allowSubmitWithErrors, STATUS.PENDING_REVIEW.value, false);

      flashMessage.open(
        "Dates submitted to HQ",
        `${seasonTitle} ${season.operatingYear} dates submitted to HQ`,
      );

      if (formToOpen) {
        openNextForm(formToOpen);
        return;
      }

      closePanel();
    } catch (saveError) {
      console.error("Error submitting season:", saveError);
      flashMessage.open(
        "Could not submit dates",
        "Please try again.",
        { variant: "error" },
      );
    }
  }

  if (loading) {
    return (
      <>
        <Offcanvas.Header closeButton></Offcanvas.Header>
        <Offcanvas.Body>
          <LoadingBar />
        </Offcanvas.Body>
      </>
    );
  }

  if (error || !season) {
    const errorCode = error?.response?.status ?? error?.status;

    return (
      <>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {errorCode
              ? `Error ${errorCode} loading season data`
              : "Error loading season data"}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body></Offcanvas.Body>
      </>
    );
  }

  return (
    <DataContext.Provider
      value={{
        setData,
        addDeletedDateRangeId,
        hideAnnualCheckbox: isEditingPublishedSeason,
      }}
    >
      <ValidationContext.Provider value={validation}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            {seasonMetadata.featureTypeName && (
              <h4 className="header-with-icon fw-normal">
                {seasonMetadata.icon && (
                  <FeatureIcon iconName={seasonMetadata.icon} />
                )}
                {seasonMetadata.featureTypeName}
              </h4>
            )}

            <h2>{seasonTitle}</h2>
            <div className="d-flex align-items-center">
              {showOperatingYearSelect ? (
                // Display the operating year form in the Edit published page
                <OperatingYearSelect
                  season={season}
                  seasonOptions={seasonOptions}
                  loadingSeasonOptions={loadingSeasonOptions}
                  onSeasonChange={onSeasonChange}
                />
              ) : (
                // Display the operating year text in the Submit page
                <h2 className="fw-normal">{yearHeaderText}</h2>
              )}

              <div className="ms-3 mb-2">
                <StatusBadge
                  status={season.status}
                  informationSvcApproved={informationSvcApproved}
                  reservationSvcApproved={reservationSvcApproved}
                />
              </div>
            </div>

            <LastUpdatedInfo lastUpdated={season?.lastUpdated ?? null} />

            <p className="fs-6 fw-normal">
              <a
                href="https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays"
                target="_blank"
              >
                View a list of all statutory holidays
              </a>
            </p>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body>
          <div id="validation-errors">
            {shouldShowErrorSummary && (
              <div className="row">
                <div className="col-12 col-lg-7 col-xl-6 mb-4">
                  <ErrorSummary
                    multipleFeatures={multipleFeatures}
                    errors={validation.errors}
                    dateableNameMap={dateableNames}
                    showSubmitAnyway={shouldShowSubmitAnyway}
                  />
                </div>
              </div>
            )}
          </div>

          <h3>Public information</h3>
          <p>This information is displayed on bcparks.ca</p>

          {/* 1 - park level */}
          {level === "park" && (
            <ParkSeasonForm
              season={season}
              previousSeasonDates={previousSeasonDates}
              winterSeason={winterSeason}
              previousWinterSeasonDates={previousWinterSeasonDates}
              dateTypes={seasonMetadata.dateTypes}
              approver={approver}
            />
          )}

          {/* 2 - park area level */}
          {level === "park-area" && (
            <AreaSeasonForm
              season={season}
              previousSeasonDates={previousSeasonDates}
              // Individual date types for areas and features
              areaDateTypes={seasonMetadata.areaDateTypes}
              featureDateTypesByFeatureId={
                seasonMetadata.featureDateTypesByFeatureId
              }
              approver={approver}
            />
          )}

          {/* 3 - feature level */}
          {level === "feature" && (
            <FeatureSeasonForm
              season={season}
              previousSeasonDates={previousSeasonDates}
              dateTypes={seasonMetadata.dateTypes}
              approver={approver}
            />
          )}

          <InternalNotes
            notes={notes}
            setNotes={setNotes}
            previousNotes={season.changeLogs}
            optional={
              season.status !== STATUS.APPROVED.value &&
              season.status !== STATUS.PUBLISHED.value
            }
          />

          {/* Pseudo-validation for submitting with errors: User must provide an internal note */}
          {shouldShowSubmitAnyway && submitWithErrors && !notes.trim() && (
            <div
              className="text-danger validation-errors mb-5"
              data-error-slot-id="submit-with-errors-notes"
            >
              <div>
                Required when submitting with errors. Please explain why errors
                do not apply.
              </div>
            </div>
          )}

          {/* For users who can submit or approve, show a checkbox to and bypass validation */}
          {shouldShowSubmitAnyway && (submitter || approver) && (
            <div className="row">
              <div className="col-12 col-lg-7 col-xl-6 mb-4">
                <div
                  className="alert alert-warning fade show px-5 py-4 text-black"
                  role="alert"
                >
                  <h4>Submit anyway</h4>

                  <Form.Check
                    label={
                      <>
                        I have reviewed the errors and confirm the information
                        is correct. An <strong>Internal note</strong> is
                        required to explain why errors do not apply.
                      </>
                    }
                    id={"submit-with-errors"}
                    checked={submitWithErrors}
                    onChange={(e) => setSubmitWithErrors(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Option to open the next form in the table after submitting/approving,
              or after saving a draft for park operators */}
          {showContinueOption && (approver || submitter || parkOperator) && (
            <Form.Check
              className="mb-3"
              label="Continue to next form"
              id="continue-to-next-form"
              checked={continueToNext}
              disabled={!hasNextForm}
              onChange={(e) => setContinueToNext(e.target.checked)}
            />
          )}

          <Buttons
            approver={approver}
            submitter={submitter}
            parkOperator={parkOperator}
            onApprove={onApprove}
            onSave={() => promptAndSave()}
            onSaveAndContinue={() => promptAndSave(true)}
            onSubmit={onSubmit}
            loading={sendingSave}
            disableDraftButton={disableDraftButton}
            disablePrimaryActionButton={disablePrimaryActionButton}
            continueToNext={showContinueOption && continueToNext}
          />
        </Offcanvas.Body>
      </ValidationContext.Provider>
    </DataContext.Provider>
  );
}

SeasonForm.propTypes = {
  seasonId: PropTypes.number.isRequired,
  level: PropTypes.string.isRequired,
  showOperatingYearSelect: PropTypes.bool,
  onSeasonChange: PropTypes.func,
  closePanel: PropTypes.func.isRequired,
  handleStatusCancelClose: PropTypes.func.isRequired,
  onDataUpdate: PropTypes.func.isRequired,
  dataChanged: PropTypes.bool.isRequired,
  setDataChanged: PropTypes.func.isRequired,
  modal: PropTypes.object.isRequired,
  registerSaveDraftHandler: PropTypes.func.isRequired,
  showContinueOption: PropTypes.bool,
  continueToNext: PropTypes.bool,
  hasNextForm: PropTypes.bool,
  setContinueToNext: PropTypes.func,
  nextForm: PropTypes.shape({
    seasonId: PropTypes.number.isRequired,
    level: PropTypes.string.isRequired,
  }),
  openNextForm: PropTypes.func,
};

function FormPanel({
  show,
  setShow,
  formData,
  onDataUpdate,
  formList = null,
  onOpenForm = null,
}) {
  // Track if the form data has changed.
  // Synced with the computed value in the SeasonForm component
  const [dataChanged, setDataChanged] = useState(false);
  // Keep the season ID and level together, so they always update in the same render.
  // (A mismatched pair would request the wrong API endpoint, e.g. a Feature season at Park level.)
  const [selectedForm, setSelectedForm] = useState(null);
  const selectedSeasonId = selectedForm?.seasonId ?? null;
  const selectedLevel = selectedForm?.level ?? null;
  const modal = useConfirmation();
  const closingFromStatusPrompt = useRef(false);

  // SeasonForm registers its save-draft function here so the "Unsaved changes" dialog can call it
  const saveDraftHandlerRef = useRef(null);

  const registerSaveDraftHandler = useCallback((handler) => {
    saveDraftHandlerRef.current = handler;
  }, []);

  /**
   * Prompts the user to save or discard their unsaved changes.
   * Falls back to a discard confirmation when drafts can't be saved (e.g. "Edit published seasons" mode).
   * @returns {Promise<boolean>} True if the user should proceed, false to stay on the form
   */
  const confirmUnsavedChanges = useCallback(async () => {
    const saveDraftHandler = saveDraftHandlerRef.current;

    if (!saveDraftHandler) {
      return modal.open({
        title: "Discard changes?",
        message: "Discarded changes will be permanently deleted.",
        confirmButtonText: "Discard changes",
        cancelButtonText: "Continue editing",
      });
    }

    return modal.confirmUnsavedChanges(saveDraftHandler);
  }, [modal]);
  // "Continue to next form" checkbox: stays selected between forms until the user deselects it
  const [continueToNext, setContinueToNext] = useState(false);

  // The option is only available when the parent page provides a list of forms,
  // and never on the "Edit published dates" form
  const showContinueOption =
    Boolean(formList && onOpenForm) && !formData?.showOperatingYearSelect;

  useEffect(() => {
    setSelectedForm(
      formData?.seasonId
        ? { seasonId: formData.seasonId, level: formData.level }
        : null,
    );
  }, [formData?.seasonId, formData?.level]);

  // Prevent navigating away if the data has changed
  useNavigationGuard(dataChanged);

  // Functions

  // Hides the form panel and resets the dataChanged state and modal
  const closePanel = useCallback(() => {
    closingFromStatusPrompt.current = false;
    setShow(false);
    setDataChanged(false);
  }, [setShow, setDataChanged]);

  // Close the panel when the status modal is dismissed
  const handleStatusCancelClose = useCallback(() => {
    closingFromStatusPrompt.current = true;
    setShow(false);
    setDataChanged(false);
  }, [setShow, setDataChanged]);

  // Prompts the user if data has changed before closing
  const promptAndClose = useCallback(async () => {
    // If we're closing due to the status modal being dismissed, don't prompt
    if (closingFromStatusPrompt.current) {
      closePanel();
      return;
    }

    if (dataChanged) {
      const proceed = await confirmUnsavedChanges();

      // If the user closes the confirmation modal, don't close the edit form
      if (!proceed) {
        return;
      }
    }

    closePanel();
  }, [dataChanged, confirmUnsavedChanges, closePanel]);

  // The next form in the table that still needs to be submitted or approved
  const nextForm = useMemo(
    () => findNextForm(formList, selectedSeasonId),
    [formList, selectedSeasonId],
  );

  // Opens the next form in the panel, without closing it
  const openNextForm = useCallback(
    (form) => {
      // The current form was just saved, so there are no unsaved changes
      setDataChanged(false);
      onOpenForm(form);
    },
    [onOpenForm],
  );

  // True if there's a form to continue to after the current one
  const hasNextForm = nextForm !== null;

  // If there are no more forms to continue to, uncheck the "Continue to next form" checkbox.
  // The primary button then shows its normal text and returns to the table.
  useEffect(() => {
    if (!hasNextForm) {
      setContinueToNext(false);
    }
  }, [hasNextForm]);

  // Only continue while there's a next form
  // (covers the render before the effect above unchecks the checkbox)
  const shouldContinue = continueToNext && hasNextForm;

  const handleSeasonChange = useCallback(
    async (nextSeasonId) => {
      if (nextSeasonId === selectedSeasonId) {
        return;
      }

      // If the form data has changed, prompt the user to save or discard changes before switching seasons
      if (dataChanged) {
        const proceed = await confirmUnsavedChanges();

        if (!proceed) {
          return;
        }
      }

      // Switching operating years keeps the same level
      setSelectedForm((prev) => ({ ...prev, seasonId: nextSeasonId }));
      setDataChanged(false);
    },
    [dataChanged, confirmUnsavedChanges, selectedSeasonId],
  );

  // Hide the form if no seasonId is provided
  return (
    <>
      <Offcanvas
        show={show}
        onHide={promptAndClose}
        placement="end"
        className="form-panel"
      >
        {selectedSeasonId && (
          <SeasonForm
            key={`${selectedLevel}-${selectedSeasonId}`}
            seasonId={selectedSeasonId}
            level={selectedLevel}
            showOperatingYearSelect={Boolean(formData.showOperatingYearSelect)}
            onSeasonChange={handleSeasonChange}
            closePanel={closePanel}
            handleStatusCancelClose={handleStatusCancelClose}
            // The form can trigger a function to re-fetch data after saving
            onDataUpdate={onDataUpdate}
            // Track if the form data has changed from user interaction
            dataChanged={dataChanged}
            setDataChanged={setDataChanged}
            modal={modal}
            registerSaveDraftHandler={registerSaveDraftHandler}
            showContinueOption={showContinueOption}
            continueToNext={shouldContinue}
            hasNextForm={hasNextForm}
            setContinueToNext={setContinueToNext}
            nextForm={nextForm}
            openNextForm={openNextForm}
          />
        )}
      </Offcanvas>

      <ConfirmationDialog {...modal.props} />
    </>
  );
}

export default FormPanel;

FormPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  formData: PropTypes.object,
  onDataUpdate: PropTypes.func.isRequired,
  formList: PropTypes.arrayOf(
    PropTypes.shape({
      seasonId: PropTypes.number.isRequired,
      level: PropTypes.string.isRequired,
      status: PropTypes.string,
    }),
  ),
  onOpenForm: PropTypes.func,
};
