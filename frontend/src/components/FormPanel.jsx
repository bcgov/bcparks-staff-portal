import { useContext, useEffect, useMemo, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import PropTypes from "prop-types";
import { omit } from "lodash-es";

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

function Buttons({ onSave, onSubmit, onApprove, approver, loading = false }) {
  return (
    <div>
      <button
        type="button"
        onClick={onSave}
        className="btn btn-outline-primary fw-bold me-3"
      >
        Save draft
      </button>
      {approver ? (
        <button
          type="button"
          onClick={onApprove}
          className="btn btn-primary fw-bold me-2"
        >
          Mark approved
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="btn btn-primary fw-bold me-2"
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
  onSave: PropTypes.func,
  onSubmit: PropTypes.func,
  onApprove: PropTypes.func,
  approver: PropTypes.bool,
  loading: PropTypes.bool,
};

function SeasonForm({
  seasonId,
  level,
  closePanel,
  onDataUpdate,
  setDataChanged,
}) {
  // Global flash message context
  const flashMessage = useContext(globalFlashMessageContext);

  // Hooks
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  const [data, setData] = useState(null);
  const [notes, setNotes] = useState("");
  const [deletedDateRangeIds, setDeletedDateRangeIds] = useState([]);

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

  // Clears and re-fetches the data
  function resetData() {
    setData(null);

    // Refresh the data from the API
    refreshData();
  }

  // Track deleted date range IDs
  function addDeletedDateRangeId(id) {
    setDeletedDateRangeIds((prev) => [...prev, id]);
  }

  // Memoize the updated data for saving or detecting changes
  const savePayload = useMemo(() => {
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

    const changedDateRanges = seasonDateRanges
      .filter((range) => range.changed)
      // We only need the dateTypeId, drop fields we don't need to send
      .map((range) => omit(range, ["changed", "dateType"]));

    const changedDateRangeAnnuals = season.dateRangeAnnuals.filter(
      (dateRangeAnnual) => dateRangeAnnual.changed,
    );

    const payload = {
      dateRanges: changedDateRanges,
      deletedDateRangeIds,
      dateRangeAnnuals: changedDateRangeAnnuals,
      gateDetail: season.gateDetail,
      readyToPublish: season.readyToPublish,
      notes,
    };

    return payload;
  }, [level, season, deletedDateRangeIds, notes]);

  // Calculate if the form data has changed
  const dataChanged = useMemo(() => {
    if (!season) return false;

    // Return true if date ranges were updated
    if (savePayload.dateRanges.length) return true;

    // Return true if date ranges were deleted
    if (savePayload.deletedDateRangeIds.length) return true;

    // Check if readyToPublish changed
    if (season.readyToPublish !== apiData?.current?.readyToPublish) return true;

    // If nothing else has changed, return true if notes are entered
    return savePayload.notes.length > 0;
  }, [season, savePayload, apiData]);

  // Update the parent component when dataChanged is updated
  useEffect(() => {
    setDataChanged(dataChanged);
  }, [dataChanged, setDataChanged]);

  async function onSave(close = true) {
    await sendSave(savePayload);

    // Start refreshing the main page data from the API
    onDataUpdate();

    // Reset the form state
    setNotes("");
    setDeletedDateRangeIds([]);

    flashMessage.open(
      "Dates saved as draft",
      `${seasonTitle} ${season.operatingYear} details saved`,
    );

    if (close) {
      closePanel();
    } else {
      resetData();
    }
  }

  async function onApprove() {
    // Save first, then approve
    await onSave(false); // Don't close the form after saving

    await sendApprove();

    // Start refreshing the main page data from the API
    onDataUpdate();

    flashMessage.open(
      "Dates approved",
      `${seasonTitle} ${season.operatingYear} dates marked as approved`,
    );

    closePanel();
  }

  async function onSubmit() {
    // Save first, then submit
    await onSave(false); // Don't close the form after saving

    await sendSubmit();

    // Start refreshing the main page data from the API
    onDataUpdate();

    closePanel();
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
        <p>This information is displayed on bcpark.ca</p>

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
            featureDateTypes={seasonMetadata.featureDateTypes}
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
        />
        <Buttons
          approver={approver}
          onApprove={onApprove}
          onSave={() => onSave(false)}
          onSubmit={onSubmit}
          loading={sendingApprove || sendingSubmit || sendingSave}
        />
      </Offcanvas.Body>
    </DataContext.Provider>
  );
}

SeasonForm.propTypes = {
  seasonId: PropTypes.number.isRequired,
  level: PropTypes.string.isRequired,
  closePanel: PropTypes.func.isRequired,
  onDataUpdate: PropTypes.func.isRequired,
  setDataChanged: PropTypes.func.isRequired,
};

function FormPanel({ show, setShow, formData, onDataUpdate }) {
  // Track if the form data has changed.
  // Synced with the computed value in the SeasonForm component
  const [dataChanged, setDataChanged] = useState(false);
  const modal = useConfirmation();

  // Prevent navigating away if the data has changed
  useNavigationGuard(dataChanged);

  // Functions
  function closePanel() {
    setShow(false);
  }

  // Prompt the user if data has changed before closing
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
