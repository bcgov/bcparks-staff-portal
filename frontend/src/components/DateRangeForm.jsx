// Copied from /pages/SubmitDates.jsx

import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fa-kit/icons/classic/regular";

import TooltipWrapper from "@/components/TooltipWrapper";
import DateRangeFields from "@/components/DateRangeFields";
import { formatDateRange } from "@/lib/utils";

function DateRangeForm({
  dateRanges,
  currentYear,
  lastYear,
  hasGateDates = false,
}) {
  // Constants
  // check if there are any date ranges
  // const hasDateRanges = dateRanges && Object.keys(dateRanges).length > 0;
  const hasDateRanges = false;

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
                    <span key={date.id}>{formatDateRange(date)}</span>
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
        <div className="col-12">
          <p>
            It doesn&apos;t have any seasons in {lastYear}/{currentYear}.
          </p>
        </div>
      )}
    </div>
  );
}

DateRangeForm.propTypes = {
  dateRanges: PropTypes.object.isRequired,
  currentYear: PropTypes.string.isRequired,
  lastYear: PropTypes.string.isRequired,
  hasGateDates: PropTypes.bool,
};

export default DateRangeForm;
