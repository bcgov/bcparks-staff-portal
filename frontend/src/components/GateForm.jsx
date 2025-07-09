import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Form from "react-bootstrap/Form";
import PropTypes from "prop-types";

import DateRangeFields from "@/components/DateRangeFields";
import PreviousDates from "@/components/SeasonForms/PreviousDates";
import RadioButtonGroup from "@/components/RadioButtonGroup";
import TimeRangeForm from "@/components/TimeRangeForm";
import TooltipWrapper from "@/components/TooltipWrapper";

export default function GateForm({
  gateTitle,
  gateDescription,
  gateDetail,
  updateGateDetail,
  dateableId,
  dateType,
  dateRanges,
  updateDateRange,
  addDateRange,
  removeDateRange,
  dateRangeAnnuals,
  updateDateRangeAnnual,
  previousDateRanges,
  level,
}) {
  // Functions
  function handleCheckboxChange(e) {
    const { name, checked } = e.target;

    // if the gate opens at dawn or closes at dusk, clear the time fields
    if (name === "gateOpensAtDawn" && checked) {
      updateGateDetail({ gateOpensAtDawn: true, gateOpenTime: null });
    } else if (name === "gateClosesAtDusk" && checked) {
      updateGateDetail({ gateClosesAtDusk: true, gateCloseTime: null });
    } else {
      updateGateDetail({ [name]: checked });
    }
  }

  return (
    <div className="row mb-4">
      <div className="col-lg-6">
        <h6 className="fw-normal">{gateTitle}</h6>
        <p>{gateDescription}</p>
        <div className="mb-4">
          <RadioButtonGroup
            id="has-gate"
            name="hasGate"
            options={[
              { value: true, label: "Yes" },
              { value: false, label: "No" },
            ]}
            value={gateDetail.hasGate}
            onChange={(value) => {
              updateGateDetail({ hasGate: value });
            }}
          />
        </div>
        {gateDetail.hasGate && (
          <div>
            {/* display operating dates only at park level */}
            {level === "park" && (
              <div className="mb-4">
                <h6 className="fw-normal">
                  Operating dates{" "}
                  <TooltipWrapper
                    placement="top"
                    content={dateType.description}
                  >
                    <FontAwesomeIcon icon={faCircleInfo} />
                  </TooltipWrapper>
                </h6>

                <PreviousDates dateRanges={previousDateRanges} />

                <DateRangeFields
                  dateableId={dateableId}
                  dateType={dateType}
                  dateRanges={dateRanges}
                  previousDateRanges={previousDateRanges}
                  updateDateRange={updateDateRange}
                  addDateRange={addDateRange}
                  removeDateRange={removeDateRange}
                  dateRangeAnnuals={dateRangeAnnuals}
                  updateDateRangeAnnual={updateDateRangeAnnual}
                />
              </div>
            )}

            <h6 className="fw-normal">
              Gate hours{" "}
              <TooltipWrapper
                placement="top"
                content={`Gate Enter the hours the gate is open during the operating season.
              If the times change throughout the season,
              leave the times blank and list all the gate hours in the gate notes field.
              If you do not want to display this information publicly, leave this blank.`}
              >
                <FontAwesomeIcon icon={faCircleInfo} />
              </TooltipWrapper>
            </h6>
            <Form>
              <Form.Check
                type="checkbox"
                id="opens-at-dawn"
                name="gateOpensAtDawn"
                label="Opens at dawn"
                className="mb-2"
                checked={gateDetail.gateOpensAtDawn}
                onChange={handleCheckboxChange}
              />
              <Form.Check
                type="checkbox"
                id="closes-at-dusk"
                name="gateClosesAtDusk"
                label="Closes at dusk"
                className="mb-2"
                checked={gateDetail.gateClosesAtDusk}
                onChange={handleCheckboxChange}
              />
              <TimeRangeForm
                gateDetail={gateDetail}
                updateGateDetail={updateGateDetail}
              />
              <Form.Check
                type="checkbox"
                id="is-time-range-annual"
                name="isTimeRangeAnnual"
                label="Hours are the same every year"
                checked={gateDetail.isTimeRangeAnnual}
                onChange={handleCheckboxChange}
              />
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}

GateForm.propTypes = {
  gateTitle: PropTypes.string.isRequired,
  gateDescription: PropTypes.string.isRequired,
  gateDetail: PropTypes.shape({
    hasGate: PropTypes.bool,
    gateOpenTime: PropTypes.string,
    gateCloseTime: PropTypes.string,
    gateOpensAtDawn: PropTypes.bool,
    gateClosesAtDusk: PropTypes.bool,
    isTimeRangeAnnual: PropTypes.bool,
  }),
  updateGateDetail: PropTypes.func.isRequired,
  dateableId: PropTypes.number,
  dateType: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    description: PropTypes.string,
  }),
  dateRanges: PropTypes.arrayOf(PropTypes.object),
  updateDateRange: PropTypes.func,
  addDateRange: PropTypes.func,
  removeDateRange: PropTypes.func,
  dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object),
  updateDateRangeAnnual: PropTypes.func,
  previousDateRanges: PropTypes.arrayOf(PropTypes.object),
  level: PropTypes.string,
};
