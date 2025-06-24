import { useEffect, useMemo, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import PropTypes from "prop-types";

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

function Buttons({
  onSave,
  onSubmit,
  sendingSubmit,
  onApprove,
  sendingApprove,
  approver,
}) {
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
          className="btn btn-primary fw-bold"
        >
          <ButtonLoading show={sendingApprove} />
          Mark approved
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="btn btn-primary fw-bold"
        >
          <ButtonLoading show={sendingSubmit} />
          Submit to HQ
        </button>
      )}
    </div>
  );
}

Buttons.propTypes = {
  onSave: PropTypes.func,
  onSubmit: PropTypes.func,
  onApprove: PropTypes.func,
  approver: PropTypes.bool,
};

function SeasonForm({ seasonId, level, handleClose }) {
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

  function addDeletedDateRangeId(id) {
    setDeletedDateRangeIds((prev) => [...prev, id]);
  }

  const {
    data: apiData,
    loading,
    error,
  } = useApiGet(`/seasons/${level}/${seasonId}`);

  useEffect(() => {
    if (apiData) {
      setData(apiData);
    }
  }, [apiData]);

  // Constants
  const { current: season, previous: previousSeasonDates } = data || {};
  const currentYear = season?.operatingYear;

  async function onApprove() {
    await sendApprove(seasonId);
    handleClose();
  }

  async function onSave() {
    console.log("save here", data, notes, deletedDateRangeIds);
  }

  async function onSubmit() {
    await sendSubmit(seasonId);
    handleClose();
  }

  console.log("current season:", season);
  console.log("previous season dates:", previousSeasonDates);

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
          {/* display feature type name and icon if the form is for park-area or feature */}
          {(level === "park-area" || level === "feature") && (
            <h4 className="header-with-icon fw-normal">
              {/* TODO: fix this for all levels - include icon in API payload */}
              <FeatureIcon iconName={season.featureType?.icon} />
              {season.featureType?.name}[@TODO: feature type name and icon in
              API]
            </h4>
          )}

          <h2>{season.name} @TODO: season name? - add to API</h2>
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
          />
        )}

        {/* TODO: 2 - park area level */}
        {level === "park-area" && (
          <AreaSeasonForm
            season={season}
            previousSeasonDates={previousSeasonDates}
          />
        )}

        {/* TODO: 3 - feature level */}
        {level === "feature" && (
          <FeatureSeasonForm
            season={season}
            previousSeasonDates={previousSeasonDates}
          />
        )}

        {/* TODO: add Public Notes for v3 */}
        <InternalNotes notes={notes} setNotes={setNotes} />
        <Buttons
          approver={approver}
          onApprove={onApprove}
          sendingApprove={sendingApprove}
          onSave={onSave}
          onSubmit={onSubmit}
          sendingSubmit={sendingSubmit}
        />
      </Offcanvas.Body>
    </DataContext.Provider>
  );
}

SeasonForm.propTypes = {
  seasonId: PropTypes.number.isRequired,
  level: PropTypes.string.isRequired,
};

function FormPanel({ show, setShow, formData }) {
  // Functions
  function handleClose() {
    setShow(false);
    // @TODO: update the data in the parent
  }

  // Hide the form if no seasonId is provided
  return (
    <Offcanvas
      show={show}
      backdrop="static"
      onHide={handleClose}
      placement="end"
      className="form-panel"
    >
      {formData.seasonId && (
        <SeasonForm
          seasonId={formData.seasonId}
          level={formData.level}
          handleClose={handleClose}
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
};
