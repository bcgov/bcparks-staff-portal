// import PropTypes from "prop-types";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fa-kit/icons/classic/regular";

// TODO: create a shared component for time range and date range
function TimeRangeForm() {
  return (
    <div className="row gx-0 mb-3">
      <div className="col-lg-4 d-flex">
        <div className="form-group">
          <label className="form-label d-lg-none">Start time</label>
          <div className="input-with-append">
            <DatePicker
              className={classNames({
                "form-control": true,
              })}
              dateFormat="h:mm aa"
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={30}
              timeCaption="Time"
            />
            <FontAwesomeIcon className="append-content" icon={faClock} />
          </div>
        </div>

        <div className="date-range-dash d-none d-lg-flex align-items-center px-lg-2">
          <span>&ndash;</span>
        </div>

        <div className="form-group">
          <label className="form-label d-lg-none">End time</label>
          <div className="input-with-append">
            <DatePicker
              className={classNames({
                "form-control": true,
              })}
              dateFormat="h:mm aa"
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={30}
              timeCaption="Time"
            />
            <FontAwesomeIcon className="append-content" icon={faClock} />
          </div>
        </div>
      </div>
    </div>
  );
}

TimeRangeForm.propTypes = {};

export default TimeRangeForm;
