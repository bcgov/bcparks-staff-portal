import { useState, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import PropTypes from "prop-types";
import classNames from "classnames";
import { cloneDeep } from "lodash-es";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCircleInfo,
  faHexagonExclamation,
  faPlus,
  faXmark,
} from "@fa-kit/icons/classic/regular";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import TooltipWrapper from "@/components/TooltipWrapper";
import NavBack from "@/components/NavBack";
import FeatureIcon from "@/components/FeatureIcon";
import ChangeLogsList from "@/components/ChangeLogsList";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";

import {
  formatDateRange,
  normalizeToUTCDate,
  normalizeToLocalDate,
} from "@/lib/utils";
import paths from "@/router/paths";

import "./SubmitWinterFeesDates.scss";

function DateRange({
  dateableId,
  dateRange,
  index,
  updateDateRange,
  removeDateRange,
}) {
  const { season } = useOutletContext();

  // Keep local state until the field is blurred or Enter is pressed
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  /**
   * Returns a local date object from a UTC-zoned ISO string, or null
   * @param {string|null} dateString ISO date string from localDateRange
   * @returns {Date|null} parsed local Date
   */
  function parseInputDate(dateString) {
    // Allow null dates to pass through
    if (!dateString) return null;

    // Parse as local time
    return normalizeToLocalDate(new Date(dateString));
  }

  // Updates the local date ranges to control the DatePickers
  function onDateChange(dateField, dateObj) {
    // Store as UTC time
    const utcDateObj = normalizeToUTCDate(dateObj);

    const updatedRange = {
      ...localDateRange,
      [dateField]: utcDateObj?.toISOString() ?? null,
    };

    setLocalDateRange(updatedRange);
  }

  /**
   * Calls updateDateRange with a new date value.
   * @param {string} dateField "startDate" or "endDate"
   * @param {Date} date new date value
   * @returns {void}
   */
  function onSelect(dateField, date) {
    updateDateRange(index, dateField, date);
  }

  // Use an index based on the dateableId and index,
  // because new ranges won't have a DB ID yet
  const dateRangeId = `${dateableId}-${index}`;
  const startDateId = `start-date-${dateRangeId}`;
  const endDateId = `end-date-${dateRangeId}`;

  // @TODO: Track validation errors for the whole range, or the whole dateable feature
  const errors = {};
  const startErrors = false;
  const endErrors = false;

  // Limit the date range: Jan 1 - Dec 31 of the following year
  const minDate = new Date(season.operatingYear, 0, 1);
  const maxDate = new Date(season.operatingYear + 1, 11, 31);

  // Open the calendar to Jan 1 of the operating year if no date is set
  const openDateStart = parseInputDate(localDateRange.startDate) || minDate;
  const openDateEnd = parseInputDate(localDateRange.endDate) || minDate;

  return (
    <div className="row gx-0 dates-row operating-dates">
      <div className="col-lg-5">
        <div className="form-group mb-3 mb-lg-0">
          <label htmlFor={startDateId} className="form-label d-lg-none">
            Start date
          </label>

          <div className="input-with-append">
            <DatePicker
              id={startDateId}
              className={classNames({
                "form-control": true,
                "is-invalid": startErrors,
              })}
              minDate={minDate}
              maxDate={maxDate}
              openToDate={openDateStart}
              selected={parseInputDate(localDateRange.startDate)}
              onChange={(date) => onDateChange("startDate", date)}
              onBlur={() => {
                // Update the `dates` object on blur
                onSelect("startDate", parseInputDate(localDateRange.startDate));
              }}
              onKeyDown={(event) => {
                // Update the `dates` object on Enter
                if (event.key === "Enter" && event.target.tagName === "INPUT") {
                  onSelect(
                    "startDate",
                    parseInputDate(localDateRange.startDate),
                  );
                }
              }}
              dateFormat="EEE, MMM d, yyyy"
              showMonthYearDropdown
            />

            {/* Show the calendar icon unless the error icon is showing */}
            {!startErrors && (
              <FontAwesomeIcon
                className="append-content"
                icon={faCalendarCheck}
              />
            )}
          </div>

          {/* Show validation errors for the startDate field */}
          {errors[startDateId] && (
            <div className="error-message mt-2">
              <FontAwesomeIcon icon={faHexagonExclamation} />
              <div>{errors[startDateId]}</div>
            </div>
          )}
        </div>
      </div>

      <div className="date-range-dash d-none d-lg-flex justify-content-center col-lg-auto px-lg-2 text-center">
        <span>&ndash;</span>
      </div>

      <div className="col-lg-5">
        <div className="form-group">
          <label htmlFor={endDateId} className="form-label d-lg-none">
            End date
          </label>

          <div className="input-with-append">
            <DatePicker
              id={endDateId}
              className={classNames({
                "form-control": true,
                "is-invalid": endErrors,
              })}
              minDate={minDate}
              maxDate={maxDate}
              openToDate={openDateEnd}
              selected={parseInputDate(localDateRange.endDate)}
              onChange={(date) => onDateChange("endDate", date)}
              onBlur={() => {
                // Update the `dates` object on blur
                onSelect("endDate", parseInputDate(localDateRange.endDate));
              }}
              onKeyDown={(event) => {
                // Update the `dates` object on Enter
                if (event.key === "Enter" && event.target.tagName === "INPUT") {
                  onSelect("endDate", parseInputDate(localDateRange.endDate));
                }
              }}
              dateFormat="EEE, MMM d, yyyy"
              showMonthYearDropdown
            />

            {/* Show the calendar icon unless the error icon is showing */}
            {!endErrors && (
              <FontAwesomeIcon
                className="append-content"
                icon={faCalendarCheck}
              />
            )}
          </div>

          {/* Show validation errors for the endDate field */}
          {errors[endDateId] && (
            <div className="error-message mt-2">
              <FontAwesomeIcon icon={faHexagonExclamation} />
              <div>{errors[endDateId]}</div>
            </div>
          )}
        </div>
      </div>

      <div className="date-range-remove col-lg-1 order-last order-lg-0">
        {index > 0 && (
          <button
            className="btn btn-text text-link"
            onClick={() => removeDateRange(index, dateRange.id)}
          >
            <FontAwesomeIcon icon={faXmark} />
            <span className="ms-1 d-inline d-lg-none">
              Remove this date range
            </span>
          </button>
        )}
      </div>

      {/* Show validation errors for the date range */}
      {errors[dateRangeId] && (
        <div className="error-message mt-2">
          <FontAwesomeIcon icon={faHexagonExclamation} />
          <div>{errors[dateRangeId]}</div>
        </div>
      )}
    </div>
  );
}

function getPreviousWinterDatesText(featureData) {
  if (featureData.previousWinterDates.length === 0) {
    return "Not available";
  }

  return featureData.previousWinterDates.map(formatDateRange).join("; ");
}

function getReservationDatesText(featureData) {
  if (featureData.currentReservationDates.length === 0) {
    return "Not available";
  }

  return featureData.currentReservationDates.map(formatDateRange).join("; ");
}

function CampgroundFeature({ featureData }) {
  // Get DateType info for the tooltip from the API data
  const { season, dates, setDates, setDeletedDateRangeIds } =
    useOutletContext();
  const dateableId = featureData.dateableId;
  const featureDates = dates[dateableId];

  const winterFeeDateType = season.winterFeeDateType;

  function addDateRange() {
    setDates((prevDates) => {
      const updatedDates = cloneDeep(prevDates);

      // Add a new blank date range to the season object
      updatedDates[dateableId].push({
        startDate: null,
        endDate: null,
        changed: true,
        // Add a temporary ID for records that haven't been saved yet
        tempId: crypto.randomUUID(),
      });

      return updatedDates;
    });
  }

  function removeDateRange(index, dateRangeId) {
    setDates((prevDates) => {
      const updatedDates = cloneDeep(prevDates);

      updatedDates[dateableId] = prevDates[dateableId].filter(
        (_, i) => i !== index,
      );

      return updatedDates;
    });

    // Track the deleted date range
    if (dateRangeId) {
      setDeletedDateRangeIds((previous) => [...previous, dateRangeId]);
    }
  }

  /**
   * Updates the date range in the `dates` object.
   * @param {number} index the index of the date range in `dates[dateableId]`
   * @param {string} key key in the DateRange object to update (startDate or endDate)
   * @param {string} value new date value as a UTC ISO string
   * @returns {void}
   */
  function updateDateRange(index, key, value) {
    let newValue = null;

    if (value) {
      const date = normalizeToUTCDate(value);

      newValue = date.toISOString();
    }

    setDates((prevDates) => {
      const updatedDates = cloneDeep(prevDates);

      // Update the date value and mark the date range as changed
      updatedDates[dateableId][index][key] = newValue;
      updatedDates[dateableId][index].changed = true;

      return updatedDates;
    });
  }

  return (
    <div className="feature">
      <h4 className="feature-name mb-4">{featureData.name}</h4>

      <div className="row">
        <div className="col-md-6">
          <div
            id={`Winter-fee-dates-${featureData.id}`}
            className="date-type-header me-1 mb-2"
          >
            Winter fee dates{" "}
            {
              <TooltipWrapper
                placement="top"
                content={winterFeeDateType.description}
              >
                <FontAwesomeIcon
                  className="append-content "
                  icon={faCircleInfo}
                />
              </TooltipWrapper>
            }
          </div>

          <div className="related-dates">
            Previous winter: {getPreviousWinterDatesText(featureData)}
          </div>

          <div className="related-dates mb-2">
            Reservations: {getReservationDatesText(featureData)}
          </div>

          {featureDates.map((dateRange, index) => (
            <DateRange
              key={dateRange.id || dateRange.tempId}
              dateableId={dateableId}
              dateRange={dateRange}
              index={index}
              updateDateRange={updateDateRange}
              removeDateRange={removeDateRange}
            />
          ))}

          <div>
            <button
              className="btn btn-text text-link"
              onClick={() => addDateRange()}
            >
              <FontAwesomeIcon icon={faPlus} />
              <span className="ms-1">Add more operating dates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureType({ featureTypeData }) {
  return (
    <section className="feature-type">
      <div className="container">
        <h3 className="header-with-icon mb-4">
          <FeatureIcon iconName={featureTypeData.icon} />
          {featureTypeData.name}
        </h3>

        {featureTypeData.features.map((feature) => (
          <CampgroundFeature key={feature.id} featureData={feature} />
        ))}
      </div>
    </section>
  );
}

export default function SubmitWinterFeesDates() {
  const {
    parkId,
    seasonId,
    season,
    dates,
    notes,
    setNotes,
    readyToPublish,
    setReadyToPublish,
    navigateAndScroll,
    saveAsDraft,
    saving,
    hasChanges,
  } = useOutletContext();

  // @TODO: Implement validation
  const errors = {};

  const continueToPreviewEnabled = useMemo(() => {
    // Form must be loaded
    if (!dates) return false;

    // @TODO: Validate form too

    // All date ranges must have start and end dates
    return (
      Object.values(dates).every((dateRanges) =>
        dateRanges.every(
          (dateRange) => dateRange.startDate && dateRange.endDate,
        ),
      ) && season?.status === "requested"
    );
  }, [dates, season]);

  async function continueToPreview() {
    // @TODO: Validate winter fees edit form
    navigateAndScroll(paths.winterFeesPreview(parkId, seasonId));
  }

  return (
    <div className="page submit-winter-fees-dates">
      <div className="container">
        <NavBack routePath={paths.park(parkId)}>
          Back to {season.park.name} dates
        </NavBack>

        <header className="page-header internal">
          <h1 className="header-with-icon">
            <FeatureIcon iconName="winter-recreation" />
            {season.park.name} winter fee
          </h1>
          <h2>Edit {season.name}</h2>
        </header>

        <p className="mb-5">
          <a
            href="https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays"
            target="_blank"
          >
            View a list of all statutory holidays
          </a>
        </p>
      </div>

      <div className="mb-5">
        {season.featureTypes.map((featureType) => (
          <FeatureType key={featureType.id} featureTypeData={featureType} />
        ))}
      </div>

      <div className="container">
        <div className="row notes">
          <div className="col-lg-6">
            <h3 className="mb-4">
              Notes
              {["approved", "on API"].includes(season.status) && (
                <span className="text-danger">*</span>
              )}
            </h3>

            <ChangeLogsList changeLogs={season.changeLogs} />

            <p>
              If you are updating the current year’s dates, provide an
              explanation for why dates have changed. Provide any other notes
              about these dates if needed.
            </p>

            <div
              className={`form-group mb-4 ${errors.notes ? "has-error" : ""}`}
            >
              <textarea
                className={classNames("form-control", {
                  "is-invalid": errors.notes,
                })}
                id="notes"
                name="notes"
                rows="5"
                value={notes}
                onChange={(ev) => {
                  setNotes(ev.target.value);
                }}
              ></textarea>

              {errors.notes && (
                <div className="error-message mt-2">
                  <FontAwesomeIcon icon={faHexagonExclamation} />
                  <div>{errors.notes}</div>
                </div>
              )}
            </div>

            <ContactBox />

            <ReadyToPublishBox
              readyToPublish={readyToPublish}
              setReadyToPublish={setReadyToPublish}
            />
          </div>
        </div>

        <div className="controls d-flex flex-column flex-sm-row gap-2">
          <Link
            to={paths.park(parkId)}
            type="button"
            className="btn btn-outline-primary"
          >
            Back
          </Link>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={saveAsDraft}
            disabled={!hasChanges()}
          >
            Save draft
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={continueToPreview}
            disabled={!continueToPreviewEnabled}
          >
            Continue to preview
          </button>

          {saving && (
            <span
              className="spinner-border text-primary align-self-center me-2"
              aria-hidden="true"
            ></span>
          )}
        </div>
      </div>
    </div>
  );
}

// prop validation
const dateRangeShape = PropTypes.shape({
  id: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
});

DateRange.propTypes = {
  dateableId: PropTypes.number.isRequired,
  dateRange: dateRangeShape.isRequired,
  index: PropTypes.number.isRequired,
  updateDateRange: PropTypes.func.isRequired,
  removeDateRange: PropTypes.func.isRequired,
};

CampgroundFeature.propTypes = {
  featureData: PropTypes.shape({
    id: PropTypes.number.isRequired,
    dateableId: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    previousWinterDates: PropTypes.arrayOf(dateRangeShape).isRequired,
    currentReservationDates: PropTypes.arrayOf(dateRangeShape).isRequired,
  }).isRequired,
};

FeatureType.propTypes = {
  featureTypeData: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};
