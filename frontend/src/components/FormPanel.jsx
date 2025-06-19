import { useEffect, useMemo, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import PropTypes from "prop-types";
import { omit } from "lodash-es";

import FeatureIcon from "@/components/FeatureIcon";
import InternalNotes from "@/components/InternalNotes";
import LoadingBar from "@/components/LoadingBar";
import ParkSeasonForm from "@/components/SeasonForms/ParkSeasonForm";
import AreaSeasonForm from "@/components/SeasonForms/AreaSeasonForm";
import FeatureSeasonForm from "@/components/SeasonForms/FeatureSeasonForm";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import useAccess from "@/hooks/useAccess";
import DataContext from "@/contexts/DataContext";

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

function SeasonForm({ seasonId, level, handleClose, onDataUpdate }) {
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

  function addDeletedDateRangeId(id) {
    setDeletedDateRangeIds((prev) => [...prev, id]);
  }

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

  // Clears and re-fetches the data
  function resetData() {
    setData(null);

    // Refresh the data from the API
    refreshData();
  }

  async function onSave(close = true) {
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

    const payload = {
      dateRanges: changedDateRanges,
      deletedDateRangeIds,
      readyToPublish: season.readyToPublish,
      notes,
    };

    await sendSave(payload);

    // Start refreshing the main page data from the API
    onDataUpdate();

    // Reset the form state
    setNotes("");
    setDeletedDateRangeIds([]);

    if (close) {
      handleClose();
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

    handleClose();
  }

  async function onSubmit() {
    // Save first, then submit
    await onSave(false); // Don't close the form after saving

    await sendSubmit();

    // Start refreshing the main page data from the API
    onDataUpdate();

    handleClose();
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

          <h2>{seasonMetadata.name}</h2>
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
          />
        )}

        {/* 3 - feature level */}
        {level === "feature" && (
          <FeatureSeasonForm
            season={season}
            previousSeasonDates={previousSeasonDates}
            dateTypes={seasonMetadata.dateTypes}
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
  handleClose: PropTypes.func.isRequired,
  onDataUpdate: PropTypes.func.isRequired,
};

function FormPanel({ show, setShow, formData, onDataUpdate }) {
  // Functions
  function handleClose() {
    setShow(false);
  }

  // Hide the form if no seasonId is provided
  return (
    <Offcanvas
      show={show}
      onHide={handleClose}
      placement="end"
      className="form-panel"
    >
      {formData.seasonId && (
        <SeasonForm
          seasonId={formData.seasonId}
          level={formData.level}
          handleClose={handleClose}
          onDataUpdate={onDataUpdate}
        />
      )}
    </Offcanvas>
  );
}

export default FormPanel;

FormPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  formData: PropTypes.object,
  onDataUpdate: PropTypes.func.isRequired,
};
