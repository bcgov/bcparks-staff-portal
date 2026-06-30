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

import FeatureIcon from "@/components/FeatureIcon";
import InternalNotes from "@/components/InternalNotes";
import LoadingBar from "@/components/LoadingBar";
import ParkSeasonForm from "@/components/SeasonForms/ParkSeasonForm";
import AreaSeasonForm from "@/components/SeasonForms/AreaSeasonForm";
import FeatureSeasonForm from "@/components/SeasonForms/FeatureSeasonForm";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import ErrorSummary from "@/components/FormErrorSummary";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import useAccess from "@/hooks/useAccess";
import useConfirmation from "@/hooks/useConfirmation";
import useNavigationGuard from "@/hooks/useNavigationGuard";
import useValidation, {
  ValidationContext,
} from "@/hooks/useValidation/useValidation";
import DataContext from "@/contexts/DataContext";
import globalFlashMessageContext from "@/contexts/FlashMessageContext";
import * as STATUS from "@/constants/seasonStatus";
import * as SEASON_TYPE from "@/constants/seasonType";
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
  onSubmit,
  onApprove,
  approver,
  submitter,
  loading = false,
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onSave}
        className="btn btn-outline-primary form-btn fw-bold me-3"
      >
        Save draft
      </button>

      {/* Show the Approve button for users with the approver role */}
      {approver && (
        <button
          type="button"
          onClick={onApprove}
          className="btn btn-primary form-btn fw-bold me-2"
        >
          Mark approved
        </button>
      )}

      {/* Show the Submit button for submitters, but hide it for approvers */}
      {submitter && !approver && (
        <button
          type="button"
          onClick={onSubmit}
          className="btn btn-primary form-btn fw-bold me-2"
        >
          Submit to HQ
        </button>
      )}

      {/* Show one loader for any loading state */}
      <ButtonLoading show={loading} />
    </div>
  );
}

Buttons.propTypes = {
  onSave: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  approver: PropTypes.bool.isRequired,
  submitter: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
};

function SeasonForm({
  seasonId,
  level,
  closePanel,
  handleStatusCancelClose,
  onDataUpdate,
  setDataChanged,
  modal,
}) {
  // Global flash message context
  const flashMessage = useContext(globalFlashMessageContext);

  // Hooks
  const { ROLES, checkAccess } = useAccess();
  const approver = checkAccess(ROLES.APPROVER);
  const submitter = checkAccess(ROLES.SUBMITTER);

  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [deletedDateRangeIds, setDeletedDateRangeIds] = useState([]);
  const [submitWithErrors, setSubmitWithErrors] = useState(false);
  const hasShownStatusPrompt = useRef(false);

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

  const { sendData: sendSave, loading: sendingSave } = useApiPost(
    `/seasons/${seasonId}/save/`,
  );

  const {
    data: apiData,
    loading,
    error,
    fetchData: refreshData,
  } = useApiGet(`/seasons/${level}/${seasonId}`);

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

  // Check season status and prompt user if needed (e.g., editing approved or published seasons)
  useEffect(() => {
    if (!season || hasShownStatusPrompt.current) return;

    async function checkStatusAndPrompt() {
      hasShownStatusPrompt.current = true;

      if (season.status === "approved") {
        const proceed = await modal.open(
          "Edit approved dates?",
          "Dates will need to be reviewed again to be approved.",
          "Edit",
          "Cancel",
        );

        if (!proceed) {
          handleStatusCancelClose();
        }
      } else if (season.status === "published") {
        const proceed = await modal.open(
          "Edit public dates on API?",
          "Dates will need to be reviewed again to be approved and published. If reservations have already begun, visitors will be affected.",
          "Continue to edit",
          "Cancel",
        );

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

    if (season.datesCanSpan2Years) {
      return `${operatingYear} – ${nextYear} dates`;
    }

    // Default: operating year
    return `${operatingYear} dates`;
  }, [season?.datesCanSpan2Years, season?.operatingYear]);

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

    const changedDateRangeAnnuals = season.dateRangeAnnuals.filter(
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
  }, [level, season, deletedDateRangeIds, notes, gateTypeId]);

  // Calculate if the form data has changed
  const dataChanged = useMemo(() => {
    if (!season) return false;

    // Return true if date ranges were updated
    if (changesPayload.dateRanges.length) return true;

    // Return true if date ranges were deleted
    if (changesPayload.deletedDateRangeIds.length) return true;

    // Check if readyToPublish changed
    if (changesPayload.readyToPublish !== apiData?.current?.readyToPublish)
      return true;

    // Check if any date annuals were updated
    if (changesPayload.dateRangeAnnuals.length) return true;

    // Check if any gateDetail values changed (for regular seasons)
    if (
      season.seasonType === SEASON_TYPE.REGULAR &&
      !isEqual(changesPayload.gateDetail, apiData?.current?.gateDetail)
    )
      return true;

    // If nothing else has changed, return true if notes are entered
    return changesPayload.notes.length > 0;
  }, [season, changesPayload, apiData]);

  // Update the parent component when dataChanged is updated
  useEffect(() => {
    setDataChanged(dataChanged);
  }, [dataChanged, setDataChanged]);

  /**
   * Saves the form data to the DB.
   * @param {boolean} close closes the form panel
   * @param {boolean} allowInvalid allows saving even if the form has validation errors
   * @param {string} status optional status to set for the season
   * @returns {Promise<void>}
   */
  async function saveForm(
    close = true,
    allowInvalid = false,
    status = STATUS.REQUESTED.value,
  ) {
    // saveForm is called on any kind of form submission, so validation happens here
    // If the form is submitted by some other means, call the validation function there too
    setSubmitted(true);

    // Validate the form before saving
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

    // Clone the payload
    const payload = { ...changesPayload };

    // Override status if provided
    if (status) {
      payload.status = status;
    }

    // Update isDateRangeAnnual for "Park gate open" date if gateDetail.hasGate is false
    if (
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
      await sendSave(payload);

      // Start refreshing the main page data from the API
      onDataUpdate();

      // Reset the form state
      setNotes("");
      setDeletedDateRangeIds([]);
      setSubmitWithErrors(false);

      if (close) {
        closePanel();
      } else {
        resetData();
      }
    } catch (saveError) {
      // @TODO: Catch API error and show a flash message
      console.error("Error saving season:", saveError);
      throw saveError;
    }
  }

  // If the season is not "requested" (e.g. it is submitted, approved, or published),
  // prompt the user to confirm moving back to draft.
  async function promptAndSave(close = true) {
    if (season.status !== STATUS.REQUESTED.value) {
      const proceed = await modal.open(
        "Move back to draft?",
        `The dates will be moved back to draft and need to be submitted again to be reviewed.

If dates have already been published, they will not be updated until new dates are submitted, approved, and published. `,
        "Move to draft",
        "Cancel",
      );

      // If the user cancels in the confirmation modal, don't close the edit form
      if (!proceed) {
        return;
      }
    }

    try {
      // Save draft, and allow saving with validation errors
      await saveForm(close, true, STATUS.REQUESTED.value);

      flashMessage.open(
        "Dates saved as draft",
        `${seasonTitle} ${season.operatingYear} details saved`,
      );
    } catch (saveError) {
      console.error("Error saving season as draft:", saveError);
    }
  }

  async function onApprove() {
    try {
      // Save and update status, bypassing validation errors if the user has checked the "Submit with errors" checkbox
      await saveForm(false, allowSubmitWithErrors, STATUS.APPROVED.value); // Don't close the form after saving

      // Start refreshing the main page data from the API
      onDataUpdate();

      flashMessage.open(
        "Dates approved",
        `${seasonTitle} ${season.operatingYear} dates marked as approved`,
      );

      closePanel();
    } catch (saveError) {
      console.error("Error approving season:", saveError);
    }
  }

  async function onSubmit() {
    try {
      // Save and update status, bypassing validation errors if the user has checked the "Submit with errors" checkbox
      await saveForm(false, allowSubmitWithErrors, STATUS.PENDING_REVIEW.value); // Don't close the form after saving

      // Start refreshing the main page data from the API
      onDataUpdate();

      flashMessage.open(
        "Dates submitted to HQ",
        `${seasonTitle} ${season.operatingYear} dates submitted to HQ`,
      );

      closePanel();
    } catch (saveError) {
      console.error("Error submitting season:", saveError);
    }
  }

  // Handle 404 errors by closing the panel
  useEffect(() => {
    if (error && error?.response?.status === 404) {
      closePanel();
    }
  }, [error, closePanel]);

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
    return (
      <>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Error loading season data</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body></Offcanvas.Body>
      </>
    );
  }

  return (
    <DataContext.Provider value={{ setData, addDeletedDateRangeId }}>
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
            <h2 className="fw-normal">{yearHeaderText}</h2>
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
            {validation.errors.length > 0 && (
              <div className="row">
                <div className="col-12 col-lg-7 col-xl-6 mb-4">
                  <ErrorSummary
                    multipleFeatures={multipleFeatures}
                    errors={validation.errors}
                    dateableNameMap={dateableNames}
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

          {/* TODO: add Public Notes for v3 */}
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
          {validation.errors.length > 0 &&
            submitWithErrors &&
            !notes.trim() && (
              <div
                className="text-danger validation-errors mb-5"
                data-error-slot-id="submit-with-errors-notes"
              >
                <div>
                  Required when submitting with errors. Please explain why
                  errors do not apply.
                </div>
              </div>
            )}

          {/* For users who can submit or approve, show a checkbox to and bypass validation */}
          {validation.errors.length > 0 && (submitter || approver) && (
            <div>
              <div
                className="alert alert-warning fade show px-5 py-4 text-black"
                role="alert"
              >
                <h4>Submit anyway</h4>

                <Form.Check
                  label={
                    "I have reviewed the errors and confirm the information is correct. An Internal note is required to explain why errors do not apply."
                  }
                  id={"submit-with-errors"}
                  checked={submitWithErrors}
                  onChange={(e) => setSubmitWithErrors(e.target.checked)}
                />
              </div>
            </div>
          )}

          <Buttons
            approver={approver}
            submitter={submitter}
            onApprove={onApprove}
            onSave={() => promptAndSave(false)}
            onSubmit={onSubmit}
            loading={sendingSave}
          />
        </Offcanvas.Body>
      </ValidationContext.Provider>
    </DataContext.Provider>
  );
}

SeasonForm.propTypes = {
  seasonId: PropTypes.number.isRequired,
  level: PropTypes.string.isRequired,
  closePanel: PropTypes.func.isRequired,
  handleStatusCancelClose: PropTypes.func.isRequired,
  onDataUpdate: PropTypes.func.isRequired,
  setDataChanged: PropTypes.func.isRequired,
  modal: PropTypes.object.isRequired,
};

function FormPanel({ show, setShow, formData, onDataUpdate }) {
  // Track if the form data has changed.
  // Synced with the computed value in the SeasonForm component
  const [dataChanged, setDataChanged] = useState(false);
  const modal = useConfirmation();
  const closingFromStatusPrompt = useRef(false);

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
      const proceed = await modal.open(
        "Discard changes?",
        "Discarded changes will be permanently deleted.",
        "Discard changes",
        "Continue editing",
      );

      // If the user cancels in the confirmation modal, don't close the edit form
      if (!proceed) {
        return;
      }
    }

    closePanel();
  }, [dataChanged, modal, closePanel]);

  // Hide the form if no seasonId is provided
  return (
    <>
      <Offcanvas
        show={show}
        onHide={promptAndClose}
        placement="end"
        className="form-panel"
      >
        {formData.seasonId && (
          <SeasonForm
            key={`${formData.level}-${formData.seasonId}`}
            seasonId={formData.seasonId}
            level={formData.level}
            closePanel={closePanel}
            handleStatusCancelClose={handleStatusCancelClose}
            onDataUpdate={onDataUpdate}
            setDataChanged={setDataChanged}
            modal={modal}
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
};
