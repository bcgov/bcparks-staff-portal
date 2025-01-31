import { useEffect, useState, createContext, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import classNames from "classnames";
import groupBy from "lodash/groupBy";
import cloneDeep from "lodash/cloneDeep";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faTriangleExclamation,
  faCalendarCheck,
} from "@fa-kit/icons/classic/regular";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import TooltipWrapper from "@/components/TooltipWrapper";
import NavBack from "@/components/NavBack";
import LoadingBar from "@/components/LoadingBar";
import FeatureIcon from "@/components/FeatureIcon";
import ChangeLogsList from "@/components/ChangeLogsList";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import {
  formatDateRange,
  normalizeToUTCDate,
  normalizeToLocalDate,
} from "@/lib/utils";

import "./SubmitWinterFeesDates.scss";

// Context to provide dates to all the child components
const datesContext = createContext();

// Context to provide the data to all the child components
const dataContext = createContext();

function DateRange({ dateRange, index, updateDateRange }) {
  const data = useContext(dataContext);

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
    updateDateRange(
      index,
      dateField,
      date,
      // @TODO: Callback to validate the new value
      // (updatedDates) => {
      //   onUpdateDateRange({
      //     dateRange,
      //     datesObj: updatedDates,
      //   });
      // },
    );
  }

  // Use an index based on the dateableId and index,
  // because new ranges won't have a DB ID yet
  const dateRangeId = `${dateRange.dateableId}-${index}`;
  const startDateId = `start-date-${dateRangeId}`;
  const endDateId = `end-date-${dateRangeId}`;

  // @TODO: Track validation errors for the whole range, or the whole dateable feature
  const errors = {};
  const startErrors = false;
  const endErrors = false;

  // Limit the date range: Jan 1 - Dec 31 of the following year
  const minDate = new Date(data.operatingYear, 0, 1);
  const maxDate = new Date(data.operatingYear + 1, 11, 31);

  // Open the calendar to Jan 1 of the operating year if no date is set
  const openDateStart = parseInputDate(localDateRange.startDate) || minDate;
  const openDateEnd = parseInputDate(localDateRange.endDate) || minDate;

  return (
    <div className="row dates-row operating-dates">
      <div className="col-lg-5">
        <div className="form-group">
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
          {errors?.[startDateId] && (
            <div className="error-message mt-2">{errors?.[startDateId]}</div>
          )}
        </div>
      </div>

      <div className="d-none d-lg-block col-lg-1 text-center">
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
          {errors?.[endDateId] && (
            <div className="error-message mt-2">{errors?.[endDateId]}</div>
          )}
        </div>
      </div>

      {/* Show validation errors for the date range */}
      {errors?.[dateRangeId] && (
        <div className="error-message mt-2">
          <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
          {errors?.[dateRangeId]}
        </div>
      )}
    </div>
  );
}

function CampgroundFeature({ featureData, campgroundName }) {
  const { seasonId } = useParams();

  let headerText = "";

  if (campgroundName !== "All sites" && featureData.name !== "All sites") {
    headerText = `${campgroundName}: ${featureData.name}`;
  } else if (campgroundName !== "All sites") {
    headerText = campgroundName;
  } else if (featureData.name !== "All sites") {
    headerText = featureData.name;
  }

  // Inject dates object from the root component
  const { dates, setDates } = useContext(datesContext);
  const dateableId = featureData.dateableId;
  const { currentSeasonDates = [], previousSeasonDates = [] } =
    dates[dateableId] ?? {};

  // Get DateType info for the tooltip from the API data
  const { dateTypes } = useContext(dataContext);
  const winterDateType = dateTypes.find(
    (dateType) => dateType.name === "Winter fees",
  );

  // Add the index from currentSeasonDates to each date range before splitting them up
  // (This won't be necessary when we re-structure the data in the API)
  const currentSeasonDatesIndexed = currentSeasonDates.map(
    (dateRange, index) => ({
      ...dateRange,
      index,
    }),
  );

  // Group dates by type
  const currentDatesByType = groupBy(
    currentSeasonDatesIndexed,
    "dateType.name",
  );
  const currentWinterDates = currentDatesByType?.["Winter fees"] ?? [];
  const currentReservationDates = currentDatesByType?.Reservation ?? [];

  const previousDatesByType = groupBy(previousSeasonDates, "dateType.name");
  const previousWinterDates = previousDatesByType?.["Winter fees"] ?? [];

  function addDateRange() {
    setDates((prevDates) => {
      const updatedDates = cloneDeep(prevDates);

      // Add a new blank date range to the season object
      updatedDates[dateableId].currentSeasonDates.push({
        seasonId,
        startDate: null,
        endDate: null,
        dateableId,
        dateType: winterDateType,
        changed: true,
      });

      return updatedDates;
    });
  }

  /**
   * Updates the date range in the `dates` object.
   * @param {number} index the index of the date range in `currentSeasonDates`
   * @param {string} key key in the DateRange object to update (startDate or endDate)
   * @param {string} value new date value as a UTC ISO string
   * @param {Function} [callback] validation callback to run after updating the date
   * @returns {void}
   */
  function updateDateRange(index, key, value, callback = null) {
    let newValue = null;

    if (value) {
      const date = normalizeToUTCDate(value);

      newValue = date.toISOString();
    }

    setDates((prevDates) => {
      const updatedDates = cloneDeep(prevDates);

      // Update the date value and mark the date range as changed
      updatedDates[dateableId].currentSeasonDates[index][key] = newValue;
      updatedDates[dateableId].currentSeasonDates[index].changed = true;

      if (callback) {
        callback(updatedDates);
      }

      return updatedDates;
    });
  }

  return (
    <section className="feature sub-area mb-4">
      <h4>{headerText}</h4>

      <div className="row">
        <div className="col-md-6">
          <div className="date-type-header me-1 mb-2">
            Winter fee dates{" "}
            {winterDateType && (
              <TooltipWrapper
                placement="top"
                content={winterDateType.description}
              >
                <FontAwesomeIcon
                  className="append-content "
                  icon={faCircleInfo}
                />
              </TooltipWrapper>
            )}
          </div>

          <div className="related-dates">
            Previous winter:{" "}
            {previousWinterDates.map(formatDateRange).join("; ")}
          </div>

          <div className="related-dates mb-2">
            Reservations:{" "}
            {currentReservationDates.map(formatDateRange).join("; ")}
          </div>

          {currentWinterDates.map((dateRange) => (
            <DateRange
              key={dateRange.index}
              dateRange={dateRange}
              index={dateRange.index}
              updateDateRange={updateDateRange}
            />
          ))}

          <p>
            <button
              className="btn btn-text-primary text-link"
              onClick={() => addDateRange()}
            >
              + Add more winter fee dates
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

function Campground({ name, features }) {
  return (
    <div className="campground mb-5">
      {features.map((feature) => (
        <CampgroundFeature
          key={feature.id}
          featureData={feature}
          campgroundName={name}
        />
      ))}
    </div>
  );
}

function FeatureType({ featureTypeData }) {
  const campgrounds = Object.entries(featureTypeData.campgrounds);

  return (
    <div className="feature-type mb-5">
      <h3 className="header-with-icon mb-4">
        <FeatureIcon iconName={featureTypeData.icon} />
        {featureTypeData.name}
      </h3>

      {campgrounds.map(([campgroundName, campgroundData]) => (
        <Campground
          key={campgroundName}
          name={campgroundName}
          features={campgroundData}
        />
      ))}
    </div>
  );
}

export default function SubmitWinterFeesDates() {
  const parkId = Number(useParams().parkId);
  const seasonId = Number(useParams().seasonId);

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState({});
  const [notes, setNotes] = useState("");
  const [readyToPublish, setReadyToPublish] = useState(false);

  const { data, loading, error, fetchData } = useApiGet(
    `/winter-fees/${seasonId}`,
  );

  const {
    sendData,
    // error: saveError, // @TODO: handle save errors
    loading: saving,
  } = useApiPost(`/winter-fees/${seasonId}/save/`);

  // @TODO: validation
  const errors = {};

  function validateNotes() {}

  // @TODO: implement hasChanges
  function hasChanges() {
    if (notes) return true;

    // @TODO: loop through all the dates and return true if any have changed=true

    return false;
  }

  // @TODO: implement save functions
  function saveAsDraft() {
    console.log("save as draft:", dates, notes, readyToPublish);
  }
  function continueToPreview() {
    console.log("continue to preview:", dates, notes, readyToPublish);
  }

  // @TODO: maybe this isn't needed?
  useEffect(() => {
    if (!data) return;

    // Format the data for the page state: flatten the features
    const dateEntries = data.featureTypes.flatMap((featureType) => {
      // Flatten and format the feature objects
      const features = Object.values(featureType.campgrounds).flat();

      // return object entries
      const groupedDates = features.map((feature) => [
        feature.dateableId,
        feature.dateRanges,
      ]);

      return groupedDates;
    });

    // Group by dateable IDs
    const dateableGroups = Object.fromEntries(dateEntries);

    setSeason(data);
    setDates(dateableGroups);
    setReadyToPublish(data.readyToPublish);
  }, [data]);

  if (loading || !season) {
    return <LoadingBar />;
  }

  if (error) {
    return <p>Error loading season data: {error.message}</p>;
  }

  return (
    <div className="page submit-winter-fees-dates">
      <NavBack routePath={`/park/${parkId}`}>
        Back to {season.park.name} season dates
      </NavBack>

      <header className="page-header internal">
        <h1 className="header-with-icon">
          <FeatureIcon iconName="winter-recreation" />
          {season.park.name} winter fees
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

      <dataContext.Provider value={data}>
        <datesContext.Provider value={{ dates, setDates }}>
          {season.featureTypes.map((featureType) => (
            <FeatureType key={featureType.id} featureTypeData={featureType} />
          ))}
        </datesContext.Provider>
      </dataContext.Provider>

      <div className="row notes">
        <div className="col-lg-6">
          <h2 className="mb-4">
            Notes
            {["approved", "published"].includes(season.status) && (
              <span className="text-danger">*</span>
            )}
          </h2>

          <ChangeLogsList changeLogs={season.changeLogs} />

          <p>
            If you are updating the current year’s dates, provide an explanation
            for why dates have changed. Provide any other notes about these
            dates if needed.
          </p>

          <div className={`form-group mb-4 ${errors.notes ? "has-error" : ""}`}>
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
                validateNotes(ev.target.value);
              }}
            ></textarea>
            {errors.notes && (
              <div className="error-message mt-2">{errors.notes}</div>
            )}
          </div>

          <ContactBox />

          <ReadyToPublishBox
            readyToPublish={readyToPublish}
            setReadyToPublish={setReadyToPublish}
          />

          <div className="controls d-flex mt-4">
            <Link
              to={`/park/${parkId}`}
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
              disabled={!hasChanges()}
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
    </div>
  );
}

// prop validation
DateRange.propTypes = {
  dateRange: PropTypes.shape({
    dateableId: PropTypes.number.isRequired,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  updateDateRange: PropTypes.func.isRequired,
};

CampgroundFeature.propTypes = {
  featureData: PropTypes.shape({
    dateableId: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  campgroundName: PropTypes.string.isRequired,
};

Campground.propTypes = {
  name: PropTypes.string.isRequired,
  features: PropTypes.arrayOf(PropTypes.object).isRequired,
};

FeatureType.propTypes = {
  featureTypeData: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    campgrounds: PropTypes.object.isRequired,
  }).isRequired,
};
