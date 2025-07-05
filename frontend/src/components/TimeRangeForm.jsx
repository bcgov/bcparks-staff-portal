import PropTypes from "prop-types";
import classNames from "classnames";
import DatePicker from "react-datepicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fa-kit/icons/classic/regular";
import { dateToTimeString, timeStringToDate } from "@/lib/utils";

// TODO: create a shared component for time range and date range
function TimeRangeForm({ gateDetail, updateGateDetail }) {
  return (
    <div className="row gx-0 mb-3">
      <div className="col-lg-4 d-flex">
        <div className="form-group">
          <label className="form-label d-lg-none">Start time</label>
          <div className="input-with-append">
            <DatePicker
              selected={timeStringToDate(gateDetail.gateOpenTime)}
              onChange={(value) =>
                updateGateDetail({ gateOpenTime: dateToTimeString(value) })
              }
              className={classNames("form-control")}
              dateFormat="h:mm aa"
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={30}
              timeCaption="Time"
              disabled={gateDetail.gateOpensAtDawn}
              minTime={new Date(0, 0, 0, 7, 0)}
              maxTime={new Date(0, 0, 0, 23, 0)}
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
              selected={timeStringToDate(gateDetail.gateCloseTime)}
              onChange={(value) =>
                updateGateDetail({ gateCloseTime: dateToTimeString(value) })
              }
              className={classNames({
                "form-control": true,
              })}
              dateFormat="h:mm aa"
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={30}
              showTimeCaption={false}
              disabled={gateDetail.gateClosesAtDusk}
              minTime={new Date(0, 0, 0, 7, 0)}
              maxTime={new Date(0, 0, 0, 23, 0)}
            />
            <FontAwesomeIcon className="append-content" icon={faClock} />
          </div>
        </div>
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
  }).isRequired,
  updateGateDetail: PropTypes.func.isRequired,
};

export default TimeRangeForm;
