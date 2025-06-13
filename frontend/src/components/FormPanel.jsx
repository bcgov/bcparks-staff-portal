import { useState } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Form from "react-bootstrap/Form";
import Offcanvas from "react-bootstrap/Offcanvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import FormContainer from "@/components/FormContainer";
import DateRangeForm from "@/components/DateRangeForm";
import RadioButtonGroup from "@/components/RadioButtonGroup";
import TooltipWrapper from "@/components/TooltipWrapper";
import TimeRangeForm from "@/components/TimeRangeForm";
import FeatureIcon from "@/components/FeatureIcon";
import { useApiGet } from "@/hooks/useApi";
import "./FormPanel.scss";

// Components
function GateRadioButtons({ value, onChange }) {
  return (
    <div className="mb-4">
      <RadioButtonGroup
        id="has-gate"
        options={[
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ]}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

GateRadioButtons.propTypes = {
  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

function GateForm({ dateRanges, seasons, level, currentYear, lastYear }) {
  const [gateOptions, setGateOptions] = useState({
    openAtDawn: false,
    closedAtDusk: false,
    sameHoursEveryYear: false,
  });

  function handleCheckboxChange(e) {
    const { name, checked } = e.target;

    setGateOptions((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  return (
    <div className="mb-4">
      {level === "park" && (
        <DateRangeForm
          dateType="Operating dates"
          dateRanges={dateRanges}
          seasons={seasons}
          currentYear={currentYear}
          lastYear={lastYear}
        />
      )}
      <h6 className="fw-normal">
        Gate hours{" "}
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
          checked={gateOptions.openAtDawn}
          onChange={handleCheckboxChange}
        />
        <Form.Check
          type="checkbox"
          id="closed-at-dusk"
          name="closedAtDusk"
          label="Closed at dusk"
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
  );
}

GateForm.propTypes = {
  dateRanges: PropTypes.object,
  seasons: PropTypes.array,
  level: PropTypes.string,
  currentYear: PropTypes.number,
  lastYear: PropTypes.number,
};

function InternalNotes({ errors = {}, notes = "", setNotes }) {
  return (
    <div className="mb-4">
      <h3>Internal notes</h3>
      <p>
        If you are updating the current year&apos;s dates, provide an
        explanation for why dates have changed. Provide any other notes about
        these dates if needed.
      </p>
      <div className={`form-group mb-2 ${errors.notes ? "has-error" : ""}`}>
        <textarea
          id="internal-notes"
          rows="5"
          name="notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
          }}
          className={classNames({
            "form-control": true,
            "is-invalid": errors.notes,
          })}
        ></textarea>
      </div>
      <div>
        <small>Visible to all BC Parks staff and Park Operators</small>
      </div>
    </div>
  );
}

InternalNotes.propTypes = {
  errors: PropTypes.object,
  notes: PropTypes.string,
  setNotes: PropTypes.func,
};

function Buttons({ onSave, onSubmit, approver }) {
  return (
    <div>
      <button className="btn btn-outline-primary me-3" onClick={onSave}>
        Save draft
      </button>
      {approver ? (
        <button className="btn btn-primary" onClick={onSubmit}>
          Mark approved
        </button>
      ) : (
        <button className="btn btn-primary" onClick={onSubmit}>
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

function FormPanel({ show, setShow, formData, approver }) {
  // Constants
  const data = formData || {};
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // States
  const [park, setPark] = useState({
    hasGate: false,
  });
  const [parkArea, setParkArea] = useState({
    hasGate: false,
  });
  const [feature, setFeature] = useState({
    hasGate: false,
  });

  // Hooks
  const endpoint =
    data.level && data.currentSeason?.id
      ? `/seasons/${data.level}/${data.currentSeason.id}`
      : null;

  const {
    data: seasonData = {},
    // loading: seasonLoading,
    // error: seasonError,
  } = useApiGet(endpoint);

  // Functions
  function handleClose() {
    setShow(false);
  }

  // console.log("seasonData", seasonData);
  // console.log("data", data);

  return (
    <Offcanvas
      show={show}
      backdrop="static"
      onHide={handleClose}
      placement="end"
      className="form-panel"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {(data.level === "park-area" || data.level === "feature") && (
            <h4 className="header-with-icon fw-normal">
              <FeatureIcon iconName={data.featureType.icon} />
              {data.featureType.name}
            </h4>
          )}
          <h2>{data.name}</h2>
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
        {/* park */}
        {data.level === "park" && (
          <>
            {data.seasons.length > 0 && (
              <FormContainer>
                {/* TODO: tier 1 form */}
                {data.hasTier1Dates && <DateRangeForm dateType="Tier 1" />}
                {/* TODO: tier 2 form */}
                {data.hasTier2Dates && <DateRangeForm dateType="Tier 2" />}
                {/* TODO: winter fee form */}
                <DateRangeForm dateType="Winter fee" />
              </FormContainer>
            )}
            <h6 className="fw-normal">Park gate</h6>
            <p>
              Does this park have a single gated vehicle entrance? If there are
              multiple vehicle entrances, select &quot;No&quot;.
            </p>
            <GateRadioButtons
              value={park.hasGate}
              onChange={(value) => setPark({ ...park, hasGate: value })}
            />
            {park.hasGate && (
              <GateForm
                dateRanges={data.groupedDateRanges}
                seasons={data.seasons}
                level={data.level}
                currentYear={currentYear}
                lastYear={lastYear}
              />
            )}
          </>
        )}
        {/* park area */}
        {data.level === "park-area" && (
          <>
            <FormContainer>
              {/* features in park area */}
              {data.features.length > 0 &&
                data.features.map((parkAreaFeature) => (
                  <div key={parkAreaFeature.id} className="mb-4">
                    <h5>{parkAreaFeature.name}</h5>
                    {parkAreaFeature.groupedDateRanges && (
                      <DateRangeForm
                        dateRanges={parkAreaFeature.groupedDateRanges}
                        seasons={data.seasons}
                        currentYear={currentYear}
                        lastYear={lastYear}
                      />
                    )}
                  </div>
                ))}
            </FormContainer>
            <h6 className="fw-normal">{data.name} gate</h6>
            <p>Does {data.name} have a gated entrance?</p>
            <GateRadioButtons
              value={parkArea.hasGate}
              onChange={(value) => setParkArea({ ...parkArea, hasGate: value })}
            />
            {parkArea.hasGate && (
              <GateForm
                dateRanges={data.groupedDateRanges}
                seasons={data.seasons}
                level={data.level}
                currentYear={currentYear}
                lastYear={lastYear}
              />
            )}
          </>
        )}
        {/* feature */}
        {data.level === "feature" && (
          <>
            <FormContainer>
              <h5>{data.name}</h5>
              {data.groupedDateRanges && (
                <DateRangeForm
                  dateRanges={data.groupedDateRanges}
                  seasons={data.seasons}
                  currentYear={currentYear}
                  lastYear={lastYear}
                />
              )}
            </FormContainer>
            <h6 className="fw-normal">{data.name} gate</h6>
            <p>Does {data.name} have a gated entrance?</p>
            <GateRadioButtons
              value={feature.hasGate}
              onChange={(value) => setFeature({ ...feature, hasGate: value })}
            />
            {feature.hasGate && (
              <GateForm
                dateRanges={data.groupedDateRanges}
                seasons={data.seasons}
                level={data.level}
                currentYear={currentYear}
                lastYear={lastYear}
              />
            )}
          </>
        )}

        {/* TODO: add Public Notes for v3 */}
        {/* TODO: add Ready to Publish for approver */}
        {/* {approver && <ReadyToPublishBox />} */}
        <InternalNotes />
        <Buttons approver={approver} />
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default FormPanel;

FormPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  formData: PropTypes.object,
  approver: PropTypes.bool,
};
