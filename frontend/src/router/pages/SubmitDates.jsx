import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { cloneDeep, set as lodashSet } from "lodash";
import {
  faCircleInfo,
  faTriangleExclamation,
  faCalendarCheck,
} from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PropTypes from "prop-types";
import classNames from "classnames";

import NavBack from "@/components/NavBack";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import LoadingBar from "@/components/LoadingBar";
import TooltipWrapper from "@/components/TooltipWrapper";
import ChangeLogsList from "@/components/ChangeLogsList";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import FeatureIcon from "@/components/FeatureIcon";
import FlashMessage from "@/components/FlashMessage";

import useValidation from "@/hooks/useValidation";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useApiGet, useApiPost } from "@/hooks/useApi";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import {
  formatDateRange,
  normalizeToUTCDate,
  normalizeToLocalDate,
} from "@/lib/utils";
import paths from "@/router/paths";

import "./SubmitDates.scss";

function SubmitDates() {
  const { parkId, seasonId } = useParams();

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState({});
  const [notes, setNotes] = useState("");
  const [readyToPublish, setReadyToPublish] = useState(false);

  const errorFlashMessage = useFlashMessage();

  const {
    errors,
    setFormSubmitted,
    validateNotes,
    validateForm,
    onUpdateDateRange,
    ValidationError,
  } = useValidation(dates, notes, season);

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

  const { data, loading, error } = useApiGet(`/seasons/${seasonId}`);
  const { sendData, loading: saving } = useApiPost(
    `/seasons/${seasonId}/save/`,
  );

  const navigate = useNavigate();

  // are there changes to save?
  function hasChanges() {
    const datesChanged = Object.values(dates).some((dateType) =>
      dateType.Operation.concat(dateType.Reservation).some(
        (dateRange) => dateRange.changed,
      ),
    );

    const readyChanged = readyToPublish !== data.readyToPublish;

    return datesChanged || notes || readyChanged;
  }

  async function saveChanges(savingDraft) {
    setFormSubmitted(true);

    // Validate form state before saving
    if (!validateForm()) {
      throw new ValidationError("Form validation failed");
    }

    // Build a list of date ranges of all date types
    const allDates = Object.values(dates)
      .reduce(
        (acc, dateType) => acc.concat(dateType.Operation, dateType.Reservation),
        [],
      )
      // Filter out any blank ranges or unchanged dates
      .filter((dateRange) => {
        // if either date is null, skip this range
        if (dateRange.startDate === null || dateRange.endDate === null) {
          return false;
        }

        // if the range is unchanged, skip this range
        return dateRange.changed;
      })
      // Add dateTypeId to the date ranges
      .map((dateRange) => ({
        ...dateRange,
        dateTypeId: dateRange.dateType.id,
      }));

    const payload = {
      notes,
      readyToPublish,
      dates: allDates,
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

  async function continueToPreview() {
    try {
      const submitOk = await submitChanges();

      if (submitOk) {
        navigate(paths.seasonPreview(parkId, seasonId));
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

  useNavigationGuard(hasChanges, openConfirmation);

  useEffect(() => {
    if (data) {
      const currentSeasonDates = {};

      data.campgrounds.forEach((campground) => {
        campground.features.forEach((feature) => {
          currentSeasonDates[feature.dateable.id] = {
            Operation: [],
            Reservation: [],
          };
          feature.dateable.currentSeasonDates.forEach((dateRange) => {
            currentSeasonDates[feature.dateable.id][
              dateRange.dateType.name
            ].push({
              ...dateRange,
              dateableId: feature.dateable.id,
              inputType: "text",
              changed: false,
            });
          });
        });
      });

      data.features.forEach((feature) => {
        currentSeasonDates[feature.dateable.id] = {
          Operation: [],
          Reservation: [],
        };
        feature.dateable.currentSeasonDates.forEach((dateRange) => {
          currentSeasonDates[feature.dateable.id][dateRange.dateType.name].push(
            {
              ...dateRange,
              dateableId: feature.dateable.id,
              inputType: "text",
              changed: false,
            },
          );
        });
      });

      setSeason(data);
      setDates(currentSeasonDates);
      setReadyToPublish(data.readyToPublish);
    }
  }, [data]);

  function addDateRange(dateType, dateableId) {
    setDates((prevDates) => ({
      ...prevDates,
      [dateableId]: {
        ...prevDates[dateableId],
        [dateType]: [
          ...prevDates[dateableId][dateType],
          {
            seasonId: season.id,
            startDate: null,
            endDate: null,
            dateableId,
            dateType: season.dateTypes[dateType],
            changed: true,
          },
        ],
      },
    }));
  }

  function updateDateRange(
    dateableId,
    dateType,
    index,
    key,
    value,
    callback = null,
  ) {
    let newValue = null;

    if (value) {
      const date = normalizeToUTCDate(value);

      newValue = date.toISOString();
    }

    setDates((prevDates) => {
      const updatedDates = cloneDeep(prevDates);

      // Update the date value and mark the date range as changed
      lodashSet(updatedDates, [dateableId, dateType, index, key], newValue);
      lodashSet(updatedDates, [dateableId, dateType, index, "changed"], true);

      if (callback) {
        callback(updatedDates);
      }

      return updatedDates;
    });
  }

  /**
   * Returns an override for the Operating Dates description text if the
   * feature type has a specific description.
   * Otherwise, returns the general description from the db.
   * @param {string} featureType Feature Type name from the db
   * @returns {string} Operating dates tooltip text
   */
  function getOperatingDatesTooltip(featureType) {
    if (featureType === "Frontcountry campground") {
      return "All nights where the site is open for camping by the operator. Fees and service levels can vary depending on the time of year.";
    }

    if (featureType === "Backcountry") {
      return "All nights where camping is allowed. Fees and service levels can vary depending on the time of year.";
    }

    // Default: general operating dates tooltip
    return season.dateTypes.Operation.description;
  }

  // The wireframes don't show the option to remove a date, but if we need it, we can add it here
  // function removeDateRange(dateType, dateableId, index) {
  //   setDates((prevDates) => ({
  //     ...prevDates,
  //     [dateableId]: {
  //       ...prevDates[dateableId],
  //       [dateType]: prevDates[dateableId][dateType].filter((_, i) => i !== index),
  //     },
  //   }));
  // }

  function Campground({ campground }) {
    return (
      <section className="campground">
        <h3 className="campground-name mb-4">{campground.name}</h3>
        {campground.features.map((feature) => (
          <Feature key={feature.id} feature={feature} />
        ))}
      </section>
    );
  }

  Campground.propTypes = {
    campground: PropTypes.shape({
      name: PropTypes.string.isRequired,
      features: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
        }),
      ),
    }),
  };

  function DateRange({ dateRange, index }) {
    const dateRangeId = `${dateRange.dateableId}-${dateRange.dateType.id}-${index}`;
    const startDateId = `start-date-${dateRangeId}`;
    const endDateId = `end-date-${dateRangeId}`;

    // Track validation errors for the whole range, or the whole dateable feature
    const groupErrors = errors[dateRangeId] || errors[dateRange.dateableId];
    const startErrors = errors[startDateId] || groupErrors;
    const endErrors = errors[endDateId] || groupErrors;

    // Limit the date range to the operating year
    const minDate = new Date(season.operatingYear, 0, 1);
    const maxDate = new Date(season.operatingYear, 11, 31);

    // Keep local state until the field is blurred or Enter is pressed
    const [localDateRange, setLocalDateRange] = useState(dateRange);

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

    // Open the calendar to Jan 1 of the operating year if no date is set
    const openDateStart = parseInputDate(localDateRange.startDate) || minDate;
    const openDateEnd = parseInputDate(localDateRange.endDate) || minDate;

    /**
     * Calls updateDateRange with a new date value.
     * @param {string} dateField "startDate" or "endDate"
     * @param {Date} date new date value
     * @returns {void}
     */
    function onSelect(dateField, date) {
      updateDateRange(
        dateRange.dateableId,
        dateRange.dateType.name,
        index,
        dateField,
        date,
        // Callback to validate the new value
        (updatedDates) => {
          onUpdateDateRange({
            dateRange,
            datesObj: updatedDates,
          });
        },
      );
    }

    return (
      <div className="row gx-0 dates-row">
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
                  onSelect(
                    "startDate",
                    parseInputDate(localDateRange.startDate),
                  );
                }}
                onKeyDown={(event) => {
                  // Update the `dates` object on Enter
                  if (
                    event.key === "Enter" &&
                    event.target.tagName === "INPUT"
                  ) {
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
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <div>{errors[startDateId]}</div>
              </div>
            )}
          </div>
        </div>

        <div className="d-none d-lg-flex align-items-center justify-content-center col-lg-1 text-center">
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
                  if (
                    event.key === "Enter" &&
                    event.target.tagName === "INPUT"
                  ) {
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
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <div>{errors[endDateId]}</div>
              </div>
            )}
          </div>
        </div>

        {/* Show validation errors for the date range */}
        {errors[dateRangeId] && (
          <div className="error-message mt-2">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <div>{errors[dateRangeId]}</div>
          </div>
        )}
      </div>
    );
  }

  DateRange.propTypes = {
    dateRange: PropTypes.shape({
      id: PropTypes.number,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      dateableId: PropTypes.number.isRequired,
      dateType: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    }).isRequired,
    index: PropTypes.number.isRequired,
  };

  function getPreviousDates(feature, dateType) {
    const previousDates = feature.dateable.previousSeasonDates.filter(
      (date) => date.dateType.name === dateType,
    );

    if (previousDates.length === 0) {
      return "Not available";
    }

    return (
      <div>
        {previousDates.map((dateRange, index) => (
          <div key={dateRange.id} className={index > 0 ? "my-2" : "mb-2"}>
            {formatDateRange(dateRange)}
          </div>
        ))}
      </div>
    );
  }

  function Feature({ feature }) {
    return (
      <section className="feature">
        {feature.name && <h4 className="feature-name mb-4">{feature.name}</h4>}
        <div className="row">
          <div className="col-md-6">
            <div>
              <span className="me-1">Operating dates</span>
              {season?.dateTypes?.Operation?.description && (
                <TooltipWrapper
                  placement="top"
                  content={getOperatingDatesTooltip(season.featureType.name)}
                >
                  <FontAwesomeIcon
                    className="append-content "
                    icon={faCircleInfo}
                  />
                </TooltipWrapper>
              )}
            </div>

            <div className="related-dates d-flex">
              <span className="me-2">Previous:</span>{" "}
              {getPreviousDates(feature, "Operation")}
            </div>

            {dates[feature.dateable.id]?.Operation.map((dateRange, index) => (
              <DateRange key={index} dateRange={dateRange} index={index} />
            ))}

            <p>
              <button
                className="btn btn-text text-link"
                onClick={() => addDateRange("Operation", feature.dateable.id)}
              >
                + Add more operating dates
              </button>
            </p>
          </div>

          {feature.hasReservations && (
            <div className="col-md-6">
              <div>
                <span className="me-1">Reservation dates</span>
                {season?.dateTypes?.Reservation?.description && (
                  <TooltipWrapper
                    placement="top"
                    content={season.dateTypes.Reservation.description}
                  >
                    <FontAwesomeIcon
                      className="append-content "
                      icon={faCircleInfo}
                    />
                  </TooltipWrapper>
                )}
              </div>

              <div className="related-dates d-flex">
                <span className="me-2">Previous:</span>{" "}
                {getPreviousDates(feature, "Reservation")}
              </div>

              {dates[feature.dateable.id]?.Reservation.map(
                (dateRange, index) => (
                  <DateRange key={index} dateRange={dateRange} index={index} />
                ),
              )}

              <p>
                <button
                  className="btn btn-text text-link"
                  onClick={() =>
                    addDateRange("Reservation", feature.dateable.id)
                  }
                >
                  + Add more reservation dates
                </button>
              </p>
            </div>
          )}
        </div>
        {/* Show validation errors for the whole dateable feature */}
        {errors[feature.dateable.id] && (
          <div className="error-message mt-2">
            <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
            <div>{errors[feature.dateable.id]}</div>
          </div>
        )}
      </section>
    );
  }

  Feature.propTypes = {
    feature: PropTypes.shape({
      name: PropTypes.string.isRequired,
      dateable: PropTypes.shape({
        id: PropTypes.number.isRequired,
        previousSeasonDates: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            startDate: PropTypes.string,
            endDate: PropTypes.string,
            dateType: PropTypes.shape({
              id: PropTypes.number.isRequired,
              name: PropTypes.string.isRequired,
            }),
          }),
        ),
      }),
      hasReservations: PropTypes.bool.isRequired,
    }),
  };

  if (loading || !season) {
    return <LoadingBar />;
  }

  if (error) {
    return <p>Error loading season data: {error.message}</p>;
  }

  return (
    <div className="page submit-dates">
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

      <FlashMessage
        title={errorFlashMessage.flashTitle}
        message={errorFlashMessage.flashMessage}
        isVisible={errorFlashMessage.isFlashOpen}
        onClose={errorFlashMessage.handleFlashClose}
        variant="error"
      />

      <NavBack routePath={paths.park(parkId)}>
        Back to {season.park.name} dates
      </NavBack>

      <header className="page-header internal">
        <h1 className="header-with-icon">
          <FeatureIcon iconName={season.featureType.icon} />
          {season.park.name} {season.featureType.name}
        </h1>
        <h2>Edit {season.operatingYear} season dates</h2>
      </header>

      <p className="mb-5">
        <a
          href="https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays"
          target="_blank"
        >
          View a list of all statutory holidays
        </a>
      </p>

      {season?.campgrounds.map((campground) => (
        <Campground key={campground.id} campground={campground} />
      ))}

      {season?.features.map((feature) => (
        <Feature key={feature.id} feature={feature} />
      ))}

      <div className="row notes">
        <div className="col-lg-6">
          <h3 className="mb-4">
            Notes
            {["approved", "on API"].includes(season?.status) && (
              <span className="text-danger">*</span>
            )}
          </h3>

          <ChangeLogsList changeLogs={season?.changeLogs} />

          <p>
            If you are updating the current year’s dates, provide an explanation
            for why dates have changed. Provide any other notes about these
            dates if needed.
          </p>

          <div className={`form-group mb-4 ${errors.notes ? "has-error" : ""}`}>
            <textarea
              className={classNames({
                "form-control": true,
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
                <FontAwesomeIcon icon={faTriangleExclamation} />
                <div>{errors.notes}</div>
              </div>
            )}
          </div>

          <ContactBox />

          <ReadyToPublishBox
            readyToPublish={readyToPublish}
            setReadyToPublish={setReadyToPublish}
          />

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
              disabled={!hasChanges()}
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
    </div>
  );
}

export default SubmitDates;

SubmitDates.propTypes = {
  parkId: PropTypes.string,
  seasonId: PropTypes.string,
};
