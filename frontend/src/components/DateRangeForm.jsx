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
function DateRangeFields({ dateRange }) {
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
              selected={dateRange?.startDate}
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
              selected={dateRange?.endDate}
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

DateRangeFields.propTypes = {
  dateRange: PropTypes.shape({
    id: PropTypes.number,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  }),
};

function DateRangeForm({
  dateRanges,
  // seasons,
  currentYear,
  lastYear,
  hasGateDates,
  hasTier1Dates,
  hasTier2Dates,
  hasWinterDates,
}) {
  // Constants
  // check if there are any date ranges
  const hasDateRanges = dateRanges && Object.keys(dateRanges).length > 0;

  // gate date range form
  if (hasGateDates) {
    return (
      <div className="row mb-4">
        <div className="col-lg-6">
          <h6 className="fw-normal">
            Operating dates{" "}
            <TooltipWrapper placement="top" content="TEST">
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>
          <p>Previous dates are not provided</p>
          <DateRangeFields />
        </div>
      </div>
    );
  }

  // date range form for seasons
  return (
    <div className="row mb-4">
      {hasDateRanges ? (
        Object.entries(dateRanges).map(([dateTypeName, dateRange]) => {
          const lastYearRanges = dateRange[lastYear] || [];
          const currentYearRanges = dateRange[currentYear] || [];
          const hasCurrentYearRanges = currentYearRanges.length > 0;

          // date ranges available
          return (
            <div key={dateTypeName} className="col-lg-6">
              <h6 className="fw-normal">
                {dateTypeName}{" "}
                <TooltipWrapper placement="top" content={dateRange.description}>
                  <FontAwesomeIcon icon={faCircleInfo} />
                </TooltipWrapper>
              </h6>
              {/* previous year dates */}
              {lastYearRanges.length > 0 ? (
                <div className="d-flex mb-3">
                  <span className="me-2">Previous:</span>
                  {lastYearRanges.map((date) => (
                    <span key={date.id}>
                      {formatDateRangeText(date.startDate, date.endDate)}
                    </span>
                  ))}
                </div>
              ) : (
                <p>Previous dates are not provided</p>
              )}
              {/* current year dates */}
              {/* pre-populate dates if current year date ranges are available */}
              {hasCurrentYearRanges ? (
                currentYearRanges.map((date) => (
                  <DateRangeFields key={date.id} dateRange={date} />
                ))
              ) : (
                <DateRangeFields />
              )}
            </div>
          );
        })
      ) : (
        // no date ranges available
        <div className="col-lg-6">
          It doesn&apos;t have any seasons in {lastYear}/{currentYear}.
        </div>
      )}

      {/* TODO: replace them with real data */}
      {hasTier1Dates && (
        <div className="col-lg-6">
          <h6 className="fw-normal">
            Tier 1{" "}
            <TooltipWrapper placement="top" content="TEST">
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>
          <p>Previous dates are not provided</p>
          <DateRangeFields />
        </div>
      )}
      {hasTier2Dates && (
        <div className="col-lg-6">
          <h6 className="fw-normal">
            Tier 2{" "}
            <TooltipWrapper placement="top" content="TEST">
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>
          <p>Previous dates are not provided</p>
          <DateRangeFields />
        </div>
      )}
      {hasWinterDates && (
        <div className="col-lg-6">
          <h6 className="fw-normal">
            Winter{" "}
            <TooltipWrapper placement="top" content="TEST">
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>
          <p>Previous dates are not provided</p>
          <DateRangeFields />
        </div>
      )}
    </div>
  );
}

DateRangeForm.propTypes = {
  dateRanges: PropTypes.object,
  seasons: PropTypes.object,
  currentYear: PropTypes.number,
  lastYear: PropTypes.number,
  hasGateDates: PropTypes.bool,
  hasTier1Dates: PropTypes.bool,
  hasTier2Dates: PropTypes.bool,
  hasWinterDates: PropTypes.bool,
};

export default DateRangeForm;
