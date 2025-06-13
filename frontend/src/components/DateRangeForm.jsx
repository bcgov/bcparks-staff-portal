// Copied from /pages/SubmitDates.jsx

import PropTypes from "prop-types";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import Form from "react-bootstrap/Form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCircleInfo,
  faCalendarCheck,
} from "@fa-kit/icons/classic/regular";
import TooltipWrapper from "@/components/TooltipWrapper";
import { formatDateRangeText } from "@/lib/utils";

// Components
function DateRangeFields() {
  return (
    <Form>
      <div className="d-flex">
        <div className="form-group">
          <label className="form-label d-lg-none">Start date</label>
          <div className="input-with-append">
            <DatePicker
              className={classNames({
                "form-control": true,
              })}
              dateFormat="EEE, MMM d, yyyy"
              showMonthYearDropdown
            />
            <FontAwesomeIcon
              className="append-content"
              icon={faCalendarCheck}
            />
          </div>
        </div>

        <div className="date-range-dash d-none d-lg-flex align-items-center px-lg-2">
          <span>&ndash;</span>
        </div>

        <div className="form-group">
          <label className="form-label d-lg-none">End date</label>
          <div className="input-with-append">
            <DatePicker
              className={classNames({
                "form-control": true,
              })}
              dateFormat="EEE, MMM d, yyyy"
              showMonthYearDropdown
            />
            <FontAwesomeIcon
              className="append-content"
              icon={faCalendarCheck}
            />
          </div>
        </div>
      </div>

      {/* TODO */}
      <button className="btn btn-text text-link">
        <FontAwesomeIcon icon={faPlus} />
        <span className="ms-1">Add more dates</span>
      </button>

      {/* TODO */}
      <Form.Check
        type="checkbox"
        id="same-dates-every-year"
        name="sameDatesEveryYear"
        label="Dates are the same every year"
      />
    </Form>
  );
}

function DateRangeForm({
  dateType,
  dateRanges,
  // seasons,
  // currentYear,
  lastYear,
}) {
  // if there are no date ranges
  if (!dateRanges || Object.keys(dateRanges).length === 0) {
    return (
      <div className="row mb-4">
        <div key={dateType} className="col-lg-6">
          <h6 className="fw-normal">
            {/* TODO: display date type even no date? */}
            {dateType} {/* TODO: change content */}
            <TooltipWrapper placement="top" content="TEST">
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>
          <p>No dates available</p>
          <DateRangeFields />
        </div>
      </div>
    );
  }
  return (
    <div className="row">
      {Object.entries(dateRanges).map(([dateTypeName, dateRange]) => {
        const lastYearRanges = dateRange[lastYear] || [];
        // const currentYearRanges = dateRange[currentYear] || [];

        return (
          <div key={dateTypeName} className="col-lg-6">
            <h6 className="fw-normal">
              {dateTypeName}{" "}
              <TooltipWrapper placement="top" content="TEST">
                <FontAwesomeIcon icon={faCircleInfo} />
              </TooltipWrapper>
            </h6>
            {/* previous year dates */}
            {lastYearRanges.length > 0 && (
              <div className="d-flex">
                <span className="me-2">Previous:</span>
                {lastYearRanges.map((date) => (
                  <span key={date.id}>
                    {formatDateRangeText(date.startDate, date.endDate)}
                  </span>
                ))}
              </div>
            )}
            {/* current year dates */}
            <DateRangeFields />
          </div>
        );
      })}
    </div>
  );
}

DateRangeForm.propTypes = {
  dateType: PropTypes.string,
  dateRanges: PropTypes.object,
  // seasons: PropTypes.arrayOf(
  //   PropTypes.shape({
  //     id: PropTypes.number,
  //   }),
  // ),
  // currentYear: PropTypes.number,
  lastYear: PropTypes.number,
};

export default DateRangeForm;
