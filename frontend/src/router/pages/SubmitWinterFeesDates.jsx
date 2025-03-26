import { useEffect, useState, createContext, useContext, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import classNames from "classnames";
import cloneDeep from "lodash/cloneDeep";
import omit from "lodash/omit";
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
import LoadingBar from "@/components/LoadingBar";
import FeatureIcon from "@/components/FeatureIcon";
import ChangeLogsList from "@/components/ChangeLogsList";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import FlashMessage from "@/components/FlashMessage";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useFlashMessage } from "@/hooks/useFlashMessage";

import {
  formatDateRange,
  normalizeToUTCDate,
  normalizeToLocalDate,
} from "@/lib/utils";
import paths from "@/router/paths";

import "./SubmitWinterFeesDates.scss";

// Context to provide dates to all the child components
const datesContext = createContext();

// Context to provide the data to all the child components
const dataContext = createContext();

function DateRange({
  dateableId,
  dateRange,
  index,
  updateDateRange,
  removeDateRange,
}) {
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
  const minDate = new Date(data.operatingYear, 0, 1);
  const maxDate = new Date(data.operatingYear + 1, 11, 31);

  // Open the calendar to Jan 1 of the operating year if no date is set
  const openDateStart = parseInputDate(localDateRange.startDate) || minDate;
  const openDateEnd = parseInputDate(localDateRange.endDate) || minDate;

  return (
    <div className="row gx-0 dates-row operating-dates">
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

      <div className="date-range-remove col-lg-1">
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
  // Inject dates object from the root component
  const { dates, setDates, setDeletedDateRangeIds } = useContext(datesContext);
  const dateableId = featureData.dateableId;
  const featureDates = dates[dateableId];

  // Get DateType info for the tooltip from the API data
  const { winterFeeDateType } = useContext(dataContext);

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
          <div className="date-type-header me-1 mb-2">
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
  const parkId = Number(useParams().parkId);
  const seasonId = Number(useParams().seasonId);

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState({});
  const [notes, setNotes] = useState("");
  const [readyToPublish, setReadyToPublish] = useState(false);
  // Track deleted date ranges
  const [deletedDateRangeIds, setDeletedDateRangeIds] = useState([]);

  const { data, loading, error } = useApiGet(`/winter-fees/${seasonId}`);

  const { sendData, loading: saving } = useApiPost(
    `/seasons/${seasonId}/save/`,
  );

  const errorFlashMessage = useFlashMessage();

  const {
    title,
    message,
    confirmButtonText,
    cancelButtonText,
    confirmationDialogNotes,
    openConfirmation,
    handleConfirm,
    handleCancel,
    isConfirmationOpen,
  } = useConfirmation();

  const navigate = useNavigate();

  // @TODO: Implement validation
  const errors = {};

  class ValidationError extends Error {}

  function validateNotes() {}

  // Returns true if there are any form changes to save
  function hasChanges() {
    // Any existing dates changed
    if (
      Object.values(dates).some((dateRanges) =>
        dateRanges.some((dateRange) => dateRange.changed),
      )
    ) {
      return true;
    }

    // If any date ranges have been deleted
    if (deletedDateRangeIds.length > 0) return true;

    // Ready to publish state has changed
    if (readyToPublish !== data.readyToPublish) return true;

    // Notes have been entered
    return notes;
  }

  useNavigationGuard(hasChanges, openConfirmation);

  async function saveChanges(savingDraft) {
    // @TODO: Validate form state before saving

    // Turn the `dates` structure into a flat array of date ranges
    const flattenedDates = Object.entries(dates).flatMap(
      ([dateableId, dateRanges]) =>
        // Add foreign keys to the date ranges, remove tempId
        dateRanges.map((dateRange) => ({
          ...omit(dateRange, ["tempId"]),
          dateableId: Number(dateableId),
          dateTypeId: season.winterFeeDateType.id,
          seasonId,
        })),
    );

    // Filter out unchanged or empty date ranges
    const changedDates = flattenedDates.filter((dateRange) => {
      // if both dates are null and it has no ID, skip this range
      if (
        dateRange.startDate === null &&
        dateRange.endDate === null &&
        !dateRange.id
      ) {
        return false;
      }

      // if the range is unchanged, skip this range
      return dateRange.changed;
    });

    const payload = {
      notes,
      readyToPublish,
      dates: changedDates,
      deletedDateRangeIds,
    };

    const response = await sendData(payload);

    if (savingDraft) {
      navigate(`${paths.park(parkId)}?saved=${data.id}`);
    }

    return response;
  }

  async function submitChanges(savingDraft = false) {
    if (["pending review", "approved", "on API"].includes(season.status)) {
      const confirm = await openConfirmation(
        "Move back to draft?",
        "The dates will be moved back to draft and need to be submitted again to be reviewed.",
        "Move to draft",
        "Cancel",
        "If dates have already been published, they will not be updated until new dates are submitted, approved, and published.",
      );

      if (confirm) {
        await saveChanges(savingDraft);
        return true;
      }
    } else {
      await saveChanges(savingDraft);
      return true;
    }

    return false;
  }

  function showErrorFlash() {
    errorFlashMessage.openFlashMessage(
      "Unable to save changes",
      "There was a problem saving these changes. Please try again.",
    );
  }

  async function saveAsDraft() {
    try {
      await submitChanges(true);
    } catch (err) {
      console.error(err);

      if (err instanceof ValidationError) {
        // @TODO: Handle validation errors
        console.error(errors);
      } else {
        // Show a flash message for fatal server errors
        showErrorFlash();
      }
    }
  }

  const continueToPreviewEnabled = useMemo(() => {
    if (!dates) return false;

    return (
      Object.values(dates).every((dateRanges) =>
        dateRanges.every(
          (dateRange) => dateRange.startDate && dateRange.endDate,
        ),
      ) && season?.status === "requested"
    );
  }, [dates, season]);

  async function continueToPreview() {
    try {
      if (hasChanges()) {
        const submitOk = await submitChanges();

        if (submitOk) {
          navigate(paths.winterFeesPreview(parkId, seasonId));
        }
      } else {
        navigate(paths.winterFeesPreview(parkId, seasonId));
      }
    } catch (err) {
      console.error(err);

      if (err instanceof ValidationError) {
        // @TODO: Handle validation errors
        console.error(errors);
      } else {
        // Show a flash message for fatal server errors
        showErrorFlash();
      }
    }
  }

  useEffect(() => {
    if (!data) return;

    // Format the data for the page state: flatten the features
    const dateEntries = data.featureTypes.flatMap((featureType) =>
      // Create object entries with the dateable ID and date ranges
      featureType.features.map((feature) => [
        feature.dateableId,
        feature.currentWinterDates,
      ]),
    );

    // Group by dateable IDs
    const dateableGroups = Object.fromEntries(dateEntries);

    setSeason(data);
    setDates(dateableGroups);
    setReadyToPublish(data.readyToPublish);
  }, [data]);

  if (loading || !season) {
    return (
      <div className="container">
        <LoadingBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p>Error loading season data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="page submit-winter-fees-dates">
      <FlashMessage
        title={errorFlashMessage.flashTitle}
        message={errorFlashMessage.flashMessage}
        isVisible={errorFlashMessage.isFlashOpen}
        onClose={errorFlashMessage.handleFlashClose}
        variant="error"
      />

      <ConfirmationDialog
        title={title}
        message={message}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        notes={confirmationDialogNotes}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        isOpen={isConfirmationOpen}
      />

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
        <dataContext.Provider value={data}>
          <datesContext.Provider
            value={{ dates, setDates, setDeletedDateRangeIds }}
          >
            {season.featureTypes.map((featureType) => (
              <FeatureType key={featureType.id} featureTypeData={featureType} />
            ))}
          </datesContext.Provider>
        </dataContext.Provider>
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
                  validateNotes(ev.target.value);
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
            disabled={!hasChanges() && !continueToPreviewEnabled}
          >
            Save and continue to preview
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
