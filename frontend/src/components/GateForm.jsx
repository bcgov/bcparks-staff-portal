import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";

import DateRangeForm from "@/components/DateRangeForm";
import RadioButtonGroup from "@/components/RadioButtonGroup";
import TimeRangeForm from "@/components/TimeRangeForm";
import TooltipWrapper from "@/components/TooltipWrapper";

export default function GateForm({
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
