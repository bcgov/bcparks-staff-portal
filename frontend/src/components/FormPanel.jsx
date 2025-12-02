import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import PropTypes from "prop-types";
import { isEqual, omit, keyBy } from "lodash-es";

import FeatureIcon from "@/components/FeatureIcon";
import InternalNotes from "@/components/InternalNotes";
import LoadingBar from "@/components/LoadingBar";
import ParkSeasonForm from "@/components/SeasonForms/ParkSeasonForm";
import AreaSeasonForm from "@/components/SeasonForms/AreaSeasonForm";
import FeatureSeasonForm from "@/components/SeasonForms/FeatureSeasonForm";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import useAccess from "@/hooks/useAccess";
import useConfirmation from "@/hooks/useConfirmation";
import useNavigationGuard from "@/hooks/useNavigationGuard";
import useValidation, {
  ValidationContext,
} from "@/hooks/useValidation/useValidation";
import DataContext from "@/contexts/DataContext";
import globalFlashMessageContext from "@/contexts/FlashMessageContext";

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
  onDataUpdate,
  setDataChanged,
  openModal,
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

  // Track form submission state: run more validation rules after the first submit
  const [submitted, setSubmitted] = useState(false);
  const validationContext = useMemo(
    () => ({ level, notes, submitted }),
    [level, notes, submitted],
  );
  const validation = useValidation(data, validationContext);

  const { sendData: sendApprove, loading: sendingApprove } = useApiPost(
    `/seasons/${seasonId}/approve/`,
  );

  const { sendData: sendSubmit, loading: sendingSubmit } = useApiPost(
    `/seasons/${seasonId}/submit/`,
  );

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
      setData(apiData);
    }
  }, [apiData]);

  // Constants
  const {
    current: season,
    previous: previousSeasonDates,
    ...seasonMetadata
  } = data || {};
  const currentYear = season?.operatingYear;

  const seasonTitle = useMemo(() => {
    // Return blank while loading
    if (!season || !seasonMetadata) return "";

    // For Park-level seasons, return the park name
    if (level === "park") {
      return season.park.name;
    }

    // For Area/Feature-level seasons,
    // Return Park and Area/Feature name
    return `${seasonMetadata.parkName} - ${seasonMetadata.name}`;
  }, [level, season, seasonMetadata]);

  const dateTypesByStrapiId = useMemo(
    () => keyBy(seasonMetadata?.dateTypes || [], "strapiDateTypeId"),
    [seasonMetadata],
  );
  // Find the "Park gate open" date type id
  const gateTypeId = dateTypesByStrapiId[1]?.id;

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

    const payload = {
      dateRanges: changedDateRanges,
      deletedDateRangeIds: allDeletedIds,
      dateRangeAnnuals: changedDateRangeAnnuals,
      gateDetail,
      readyToPublish: season.readyToPublish,
      notes,
    };

    return payload;
  }, [level, season, deletedDateRangeIds, notes, seasonMetadata]);

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

    // Check if any gateDetail values changed
    if (!isEqual(changesPayload.gateDetail, apiData?.current?.gateDetail))
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
   * @returns {Promise<void>}
   */
  async function saveForm(close = true, allowInvalid = false) {
    // saveForm is called on any kind of form submission, so validation happens here
    // If the form is submitted by some other means, call the validation function there too
    setSubmitted(true);

    // Validate the form before saving
    const validationErrors = validation.validateForm();

    if (validationErrors.length && !allowInvalid) {
      // If there are validation errors and we're not allowing invalid saves, stop here
      throw new Error(
        `Validation failed with ${validationErrors.length} errors`,
      );
    }

    // Clone the payload
    const payload = { ...changesPayload };

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

    await sendSave(payload);

    // Start refreshing the main page data from the API
    onDataUpdate();

    // Reset the form state
    setNotes("");
    setDeletedDateRangeIds([]);

    if (close) {
      closePanel();
    } else {
      resetData();
    }
  }

  // If the season is not "requested" (e.g. it is submitted, approved, or published),
  // prompt the user to confirm moving back to draft.
  async function promptAndSave(close = true) {
    if (season.status !== "requested") {
      const proceed = await openModal(
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

    // Save draft, and allow saving with validation errors
    await saveForm(close, true);

    flashMessage.open(
      "Dates saved as draft",
      `${seasonTitle} ${season.operatingYear} details saved`,
    );

    closePanel();
  }

  async function onApprove() {
    try {
      // Save first, then approve
      await saveForm(false); // Don't close the form after saving

      await sendApprove();

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
      // Save first, then submit
      await saveForm(false); // Don't close the form after saving

      await sendSubmit();

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
            <h2 className="fw-normal">{currentYear} dates</h2>
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
          <h3>Public information</h3>
          <p>This information is displayed on bcparks.ca</p>

          {/* 1 - park level */}
          {level === "park" && (
            <ParkSeasonForm
              season={season}
              previousSeasonDates={previousSeasonDates}
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
              season.status !== "approved" && season.status !== "published"
            }
          />
          <Buttons
            approver={approver}
            submitter={submitter}
            onApprove={onApprove}
            onSave={() => promptAndSave(false)}
            onSubmit={onSubmit}
            loading={sendingApprove || sendingSubmit || sendingSave}
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
  onDataUpdate: PropTypes.func.isRequired,
  setDataChanged: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
};

function FormPanel({ show, setShow, formData, onDataUpdate }) {
  // Track if the form data has changed.
  // Synced with the computed value in the SeasonForm component
  const [dataChanged, setDataChanged] = useState(false);
  const modal = useConfirmation();

  // Prevent navigating away if the data has changed
  useNavigationGuard(dataChanged);

  // Functions

  // Hides the form panel and resets the dataChanged state
  function closePanel() {
    setShow(false);
    setDataChanged(false);
  }

  // Prompts the user if data has changed before closing
  async function promptAndClose() {
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
  }

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
            seasonId={formData.seasonId}
            level={formData.level}
            closePanel={closePanel}
            onDataUpdate={onDataUpdate}
            setDataChanged={setDataChanged}
            openModal={modal.open}
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
