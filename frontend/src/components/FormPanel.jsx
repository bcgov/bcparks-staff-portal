import { useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import Offcanvas from "react-bootstrap/Offcanvas";
import PropTypes from "prop-types";

import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useApiGet } from "@/hooks/useApi";
import DateRangeForm from "@/components/DateRangeForm";
import FeatureIcon from "@/components/FeatureIcon";
import FormContainer from "@/components/FormContainer";
import InternalNotes from "@/components/InternalNotes";
import LoadingBar from "@/components/LoadingBar";
import RadioButtonGroup from "@/components/RadioButtonGroup";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import TimeRangeForm from "@/components/TimeRangeForm";
import TooltipWrapper from "@/components/TooltipWrapper";
import useAccess from "@/hooks/useAccess";

import "./FormPanel.scss";

// Components
// TODO: separate GateForm into its own file
function GateForm({
  gateTitle,
  gateDescription,
  hasGate,
  setHasGate,
  dateRanges,
  level,
  currentYear,
  lastYear,
}) {
  // States
  const [gateOptions, setGateOptions] = useState({
    openAtDawn: false,
    closedAtDusk: false,
    sameHoursEveryYear: false,
  });

  // Functions
  function handleCheckboxChange(e) {
    const { name, checked } = e.target;

    setGateOptions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  return (
    <div className="mb-4">
      <h6 className="fw-normal">{gateTitle}</h6>
      <p>{gateDescription}</p>
      <div className="mb-4">
        <RadioButtonGroup
          id="has-gate"
          options={[
            { value: true, label: "Yes" },
            { value: false, label: "No" },
          ]}
          value={hasGate}
          onChange={(value) => setHasGate(value)}
        />
      </div>
      {hasGate && (
        <div>
          {level === "park" && (
            <DateRangeForm
              dateRanges={dateRanges}
              currentYear={currentYear}
              lastYear={lastYear}
              hasGateDates={true}
            />
          )}
          <h6 className="fw-normal">
            Gate hours {/* TODO: change content */}
            <TooltipWrapper placement="top" content="TEST">
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>
          <Form>
            <Form.Check
              type="checkbox"
              id="open-at-dawn"
              name="openAtDawn"
              label="Open at dawn"
              className="mb-2"
              checked={gateOptions.openAtDawn}
              onChange={handleCheckboxChange}
            />
            <Form.Check
              type="checkbox"
              id="closed-at-dusk"
              name="closedAtDusk"
              label="Closed at dusk"
              className="mb-2"
              checked={gateOptions.closedAtDusk}
              onChange={handleCheckboxChange}
            />
            <TimeRangeForm />
            <Form.Check
              type="checkbox"
              id="same-hours-every-year"
              name="sameHoursEveryYear"
              label="Hours are the same every year"
              checked={gateOptions.sameHoursEveryYear}
              onChange={handleCheckboxChange}
            />
          </Form>
        </div>
      )}
    </div>
  );
}

GateForm.propTypes = {
  gateTitle: PropTypes.string,
  gateDescription: PropTypes.string,
  hasGate: PropTypes.bool,
  setHasGate: PropTypes.func.isRequired,
  dateRanges: PropTypes.object,
  level: PropTypes.string,
  currentYear: PropTypes.number,
  lastYear: PropTypes.number,
};

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
  const { current, previous } = data || {};
  const currentYear = current?.operatingYear;
  const lastYear = currentYear && currentYear - 1;

  // States (@TODO: use the `current` data object)
  const [park, setPark] = useState({
    hasGate: false,
    readyToPublish: false,
  });
  const [parkArea, setParkArea] = useState({
    hasGate: false,
    readyToPublish: false,
  });
  const [feature, setFeature] = useState({
    hasGate: false,
    readyToPublish: false,
  });

  console.log("current season:", current);
  console.log("previous season:", previous);

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

  if (error || !current) {
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
          {(current.level === "park-area" || current.level === "feature") && (
            <h4 className="header-with-icon fw-normal">
              {/* TODO: fix this for all levels - include icon in API payload */}
              <FeatureIcon iconName={current.featureType.icon} />
              {current.featureType.name}
            </h4>
          )}

          <h2>{current.name}</h2>
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
        {current.level === "park" && (
          <>
            <FormContainer>
              <DateRangeForm
                dateRanges={current.groupedDateRanges}
                currentYear={currentYear}
                lastYear={lastYear}
                hasTier1Dates={current.hasTier1Dates}
                hasTier2Dates={current.hasTier2Dates}
                hasWinterFeeDates={current.hasWinterFeeDates}
              />
            </FormContainer>
            <GateForm
              gateTitle="Park gate"
              gateDescription='Does this park have a single gated vehicle entrance? If there are
              multiple vehicle entrances, select "No".'
              hasGate={park.hasGate}
              setHasGate={(value) => setPark({ ...park, hasGate: value })}
              dateRanges={current.groupedDateRanges}
              level={current.level}
              currentYear={currentYear}
              lastYear={lastYear}
            />
            {/* TODO: add Ready to Publish for approver */}
            {approver && (
              <ReadyToPublishBox
                readyToPublish={park.readyToPublish}
                setReadyToPublish={(value) =>
                  setPark({ ...park, readyToPublish: value })
                }
              />
            )}
          </>
        )}

        {/* 2- park area level */}
        {current.level === "park-area" && (
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
              level={current.level}
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
        {current.level === "feature" && (
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
              level={current.level}
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
