import { useMemo, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import PropTypes from "prop-types";

import { useApiGet } from "@/hooks/useApi";
import DateRangeForm from "@/components/DateRangeForm";
import FeatureIcon from "@/components/FeatureIcon";
import FormContainer from "@/components/FormContainer";
import InternalNotes from "@/components/InternalNotes";
import LoadingBar from "@/components/LoadingBar";

import useAccess from "@/hooks/useAccess";

import "./FormPanel.scss";
import ParkSeasonForm from "./SeasonForms/ParkSeasonForm";

// Components

function Buttons({ onSave, onSubmit, approver }) {
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
          onClick={onSubmit}
          className="btn btn-primary fw-bold"
        >
          Mark approved
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="btn btn-primary fw-bold"
        >
          Submit to HQ
        </button>
      )}
    </div>
  );
}

Buttons.propTypes = {
  onSave: PropTypes.func,
  onSubmit: PropTypes.func,
  approver: PropTypes.bool,
};

function SeasonForm({ seasonId, level }) {
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  // Hooks
  const { data, loading, error } = useApiGet(`/seasons/${level}/${seasonId}`);

  // Constants
  const { current: season, previousSeasonDates } = data || {};
  const currentYear = season?.operatingYear;
  const lastYear = currentYear && currentYear - 1;

  // States (@TODO: use the `current` data object)
  // const [park, setPark] = useState({
  //   hasGate: false,
  //   readyToPublish: false,
  // });
  const [parkArea, setParkArea] = useState({
    hasGate: false,
    readyToPublish: false,
  });
  const [feature, setFeature] = useState({
    hasGate: false,
    readyToPublish: false,
  });

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
    <>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {/* display feature type name and icon if the form is for park-area or feature */}
          {(level === "park-area" || level === "feature") && (
            <h4 className="header-with-icon fw-normal">
              {/* TODO: fix this for all levels - include icon in API payload */}
              <FeatureIcon iconName={season.featureType.icon} />
              {season.featureType.name}
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
        {level === "park" && <ParkSeasonForm season={season} />}

        {/* 2- park area level */}
        {level === "park-area" && (
          <>
            <FormContainer>
              {/* park area dates */}
              {current.groupedDateRanges &&
                Object.keys(current.groupedDateRanges).length > 0 && (
                  <DateRangeForm
                    dateRanges={current.groupedDateRanges}
                    seasons={data}
                    currentYear={currentYear}
                    lastYear={lastYear}
                  />
                )}
              {/* feature dates in park area */}
              {current.features.length > 0 &&
                current.features.map((parkAreaFeature) => (
                  <div key={parkAreaFeature.id} className="mb-4">
                    <h5>{parkAreaFeature.name}</h5>
                    {parkAreaFeature.groupedDateRanges && (
                      <DateRangeForm
                        dateRanges={parkAreaFeature.groupedDateRanges}
                        seasons={data}
                        currentYear={currentYear}
                        lastYear={lastYear}
                      />
                    )}
                  </div>
                ))}
            </FormContainer>
            <GateForm
              gateTitle={`${current.name} gate`}
              gateDescription={`Does ${current.name} have a gated entrance?`}
              hasGate={parkArea.hasGate}
              setHasGate={(value) =>
                setParkArea({ ...parkArea, hasGate: value })
              }
              dateRanges={current.groupedDateRanges}
              level={level}
              currentYear={currentYear}
              lastYear={lastYear}
            />
            {/* TODO: add Ready to Publish for approver */}
            {approver && (
              <ReadyToPublishBox
                readyToPublish={parkArea.readyToPublish}
                setReadyToPublish={(value) =>
                  setParkArea({ ...parkArea, readyToPublish: value })
                }
              />
            )}
          </>
        )}

        {/* 3 - feature level */}
        {level === "feature" && (
          <>
            <FormContainer>
              <h5>{current.name}</h5>
              {current.groupedDateRanges && (
                <DateRangeForm
                  dateRanges={current.groupedDateRanges}
                  seasons={data}
                  currentYear={currentYear}
                  lastYear={lastYear}
                />
              )}
            </FormContainer>
            <GateForm
              gateTitle={`${current.name} gate`}
              gateDescription={`Does ${current.name} have a gated entrance?`}
              hasGate={feature.hasGate}
              setHasGate={(value) => setFeature({ ...feature, hasGate: value })}
              dateRanges={current.groupedDateRanges}
              level={level}
              currentYear={currentYear}
              lastYear={lastYear}
            />
            {/* TODO: add Ready to Publish for approver */}
            {approver && (
              <ReadyToPublishBox
                readyToPublish={feature.readyToPublish}
                setReadyToPublish={(value) =>
                  setFeature({ ...feature, readyToPublish: value })
                }
              />
            )}
          </>
        )}

        {/* TODO: add Public Notes for v3 */}
        <InternalNotes />
        <Buttons approver={approver} />
      </Offcanvas.Body>
    </>
  );
}

SeasonForm.propTypes = {
  seasonId: PropTypes.string.isRequired,
  level: PropTypes.string.isRequired,
};

function FormPanel({ show, setShow, formData }) {
  // Functions
  function handleClose() {
    setShow(false);
  }

  // TODO: hook seasonData into the form
  return (
    <Offcanvas
      show={show}
      backdrop="static"
      onHide={handleClose}
      placement="end"
      className="form-panel"
    >
      {formData.seasonId && (
        <SeasonForm seasonId={formData.seasonId} level={formData.level} />
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
