import PropTypes from "prop-types";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fa-kit/icons/classic/regular";
import { dateToTimeString, timeStringToDate } from "@/lib/utils";

function TimePicker({
  value,
  onChange,
  disabled,
  placeholder,
  label,
  defaultTime,
}) {
  // Functions
  // set a default time if no value is provided
  function handleFocus() {
    if (!value && defaultTime) {
      const date = timeStringToDate(defaultTime);

      if (date) {
        onChange(dateToTimeString(date));
      }
    }
  }

  return (
    <div className="form-group">
      {label && <label className="form-label d-lg-none">{label}</label>}
      <div className="input-with-append">
        <DatePicker
          selected={timeStringToDate(value)}
          onChange={(date) => onChange(dateToTimeString(date))}
          onFocus={handleFocus}
          className={classNames("form-control")}
          dateFormat="h:mm aa"
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={30}
          showTimeCaption={false}
          disabled={disabled}
          placeholderText={placeholder}
        />
        <FontAwesomeIcon className="append-content" icon={faClock} />
      </div>
    </div>
  );
}

TimePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  defaultTime: PropTypes.string,
};

// TODO: create a shared component for time range and date range
function TimeRangeForm({ gateDetail, updateGateDetail }) {
  return (
    <div className="row gx-0 mb-3">
      <div className="col-lg-10 d-flex">
        <TimePicker
          value={gateDetail.gateOpenTime}
          onChange={(value) => updateGateDetail({ gateOpenTime: value })}
          disabled={gateDetail.gateOpensAtDawn || gateDetail.isTimeRangeAnnual}
          placeholder={
            gateDetail.gateOpensAtDawn ? "Dawn" : "Select start time"
          }
          label="Start time"
          defaultTime="07:00:00"
        />

        <div className="date-range-dash d-none d-lg-flex align-items-center px-lg-2">
          <span>&ndash;</span>
        </div>

        <TimePicker
          value={gateDetail.gateCloseTime}
          onChange={(value) => updateGateDetail({ gateCloseTime: value })}
          disabled={gateDetail.gateClosesAtDusk || gateDetail.isTimeRangeAnnual}
          placeholder={gateDetail.gateClosesAtDusk ? "Dusk" : "Select end time"}
          label="End time"
          defaultTime="23:00:00"
        />
      </div>
    </div>
  );
}

TimeRangeForm.propTypes = {
  gateDetail: PropTypes.shape({
    gateOpenTime: PropTypes.string,
    gateCloseTime: PropTypes.string,
    gateOpensAtDawn: PropTypes.bool,
    gateClosesAtDusk: PropTypes.bool,
    isTimeRangeAnnual: PropTypes.bool,
  }).isRequired,
  updateGateDetail: PropTypes.func.isRequired,
};

export default TimeRangeForm;
