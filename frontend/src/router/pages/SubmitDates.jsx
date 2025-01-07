import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { cloneDeep, set as lodashSet } from "lodash";
import { isValid, parse } from "date-fns";
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
import FlashMessage from "@/components/FlashMessage";
import TooltipWrapper from "@/components/TooltipWrapper";
import ChangeLogsList from "@/components/ChangeLogsList";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import FeatureIcon from "@/components/FeatureIcon";

import useValidation from "@/hooks/useValidation";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useApiGet, useApiPost } from "@/hooks/useApi";
import { formatDateRange, normalizeToUTCDate, formatDate } from "@/lib/utils";

import "./SubmitDates.scss";

function SubmitDates() {
  const { parkId, seasonId } = useParams();

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState({});
  const [notes, setNotes] = useState("");
  const [readyToPublish, setReadyToPublish] = useState(false);

  const {
    errors,
    setFormSubmitted,
    validateNotes,
    validateForm,
    onUpdateDateRange,
  } = useValidation(dates, notes, season);

  const {
    title,
    message,
    confirmationDialogNotes,
    openConfirmation,
    handleConfirm,
    handleCancel,
    isConfirmationOpen,
  } = useConfirmation();

  const {
    flashTitle,
    flashMessage,
    openFlashMessage,
    handleFlashClose,
    isFlashOpen,
  } = useFlashMessage();

  const { data, loading, error, fetchData } = useApiGet(`/seasons/${seasonId}`);
  const {
    sendData,
    // error: saveError, // @TODO: handle save errors
    loading: saving,
  } = useApiPost(`/seasons/${seasonId}/save/`);

  const navigate = useNavigate();

  // are there changes to save?
  function hasChanges() {
    const datesChanged = Object.values(dates).some((dateType) =>
      dateType.Operation.concat(dateType.Reservation).some(
        (dateRange) => dateRange.changed,
      ),
    );

    return datesChanged || notes;
  }

  async function saveChanges(savingDraft) {
    setFormSubmitted(true);

    // Validate form state before saving
    if (!validateForm()) {
      console.error("Form validation failed!", errors);
      throw new Error("Form validation failed");
    }

    // Build a list of date ranges of all date types
    const allDates = Object.values(dates)
      .reduce(
        (acc, dateType) => acc.concat(dateType.Operation, dateType.Reservation),
        [],
      )
      // Filter out any blank ranges
      .filter(
        (dateRange) =>
          dateRange.startDate !== null && dateRange.endDate !== null,
      );

    const payload = {
      notes,
      readyToPublish,
      dates: allDates,
    };

    const response = await sendData(payload);

    if (savingDraft) {
      setNotes("");
      fetchData();
      openFlashMessage(
        "Dates saved as draft",
        `${season?.park.name} ${season?.featureType.name} ${season?.operatingYear} season details saved`,
      );
    }

    return response;
  }

  async function submitChanges(savingDraft = false) {
    if (["pending review", "approved", "published"].includes(season.status)) {
      const confirm = await openConfirmation(
        "Move back to draft?",
        "The dates will be moved back to draft and need to be submitted again to be reviewed.",
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

  async function continueToPreview() {
    try {
      const submitOk = await submitChanges();

      if (submitOk) {
        navigate(`/park/${parkId}/edit/${seasonId}/preview`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function saveAsDraft() {
    try {
      await submitChanges(true);
    } catch (err) {
      console.error(err);
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
        <h2 className="campground-name">{campground.name}</h2>
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
    const groupErrors = errors?.[dateRangeId] || errors?.[dateRange.dateableId];
    const startErrors = errors?.[startDateId] || groupErrors;
    const endErrors = errors?.[endDateId] || groupErrors;

    // Limit the date range to the operating year
    const minDate = new Date(season.operatingYear, 0, 1);
    const maxDate = new Date(season.operatingYear, 11, 31);

    // Open the calendar to Jan 1 of the operating year if no date is set
    const openDateStart = formatDate(dateRange.startDate) || minDate;
    const openDateEnd = formatDate(dateRange.endDate) || minDate;

    /**
     * Calls updateDateRange with a new date value.
     * @param {Date} date new date value
     * @param {string} dateField "startDate" or "endDate"
     * @returns {void}
     */
    function onSelect(date, dateField) {
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

    /**
     * Parses the date input if Enter is pressed or the field is blurred.
     * @param {Event} event keydown or blur event
     * @param {string} dateField "startDate" or "endDate"
     * @returns {void}
     */
    function parseDateInput(event, dateField) {
      // Don't parse if the field is empty, or the event is outside the input
      if (!event.target.value || event.target.tagName !== "INPUT") return;

      // If Enter is pressed in the input field, or the field is blurred,
      // try parsing the date. Otherwise allow keyboard navigation as usual.
      if (event.type !== "blur" && event.key !== "Enter") return;

      // Try parsing date as YYYY-MM-DD first, and correct for time zone
      // because JS treats it as UTC time but other strings as local time.
      let date = parse(event.target.value, "yyyy-MM-dd", new Date());

      // Try parsing any other date string if parsing YYYY-MM-DD fails
      if (!isValid(date)) {
        date = new Date(event.target.value);

        // Don't set the time if it can't be parsed
        if (!isValid(date)) return;
      }

      // Update the selected date value
      onSelect(date, dateField);
    }

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
                selected={formatDate(dateRange.startDate)}
                onChange={(date) => {
                  // Set null if the field has been cleared
                  if (date === null) {
                    onSelect(null, "startDate");
                  }
                }}
                onKeyDown={(event) => parseDateInput(event, "startDate")}
                onBlur={(event) => parseDateInput(event, "startDate")}
                onSelect={(date) => onSelect(date, "startDate")}
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
                selected={formatDate(dateRange.endDate)}
                onChange={(date) => {
                  // Set null if the field has been cleared
                  if (date === null) {
                    onSelect(null, "endDate");
                  }
                }}
                onKeyDown={(event) => parseDateInput(event, "endDate")}
                onBlur={(event) => parseDateInput(event, "endDate")}
                onSelect={(date) => onSelect(date, "endDate")}
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

  function Feature({ feature }) {
    return (
      <section className="sub-area">
        <h3>{feature.name}</h3>

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

            <div className="row">
              <div className="col-auto">Previous:</div>
              <div className="col">
                {feature.dateable.previousSeasonDates
                  .filter((date) => date.dateType.name === "Operation")
                  .map((dateRange, index) => (
                    <div
                      key={formatDateRange(dateRange)}
                      className={index > 0 ? "my-2" : "mb-2"}
                    >
                      {formatDateRange(dateRange)}
                    </div>
                  ))}
              </div>
            </div>

            {dates[feature.dateable.id]?.Operation.map((dateRange, index) => (
              <DateRange key={index} dateRange={dateRange} index={index} />
            ))}

            <p>
              <button
                className="btn btn-text-primary text-link"
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

              <div className="row">
                <div className="col-auto">Previous:</div>
                <div className="col">
                  {feature.dateable.previousSeasonDates
                    .filter((date) => date.dateType.name === "Reservation")
                    .map((dateRange, index) => (
                      <div key={index} className={index > 0 ? "my-2" : "mb-2"}>
                        {formatDateRange(dateRange)}
                      </div>
                    ))}
                </div>
              </div>

              {dates[feature.dateable.id]?.Reservation.map(
                (dateRange, index) => (
                  <DateRange key={index} dateRange={dateRange} index={index} />
                ),
              )}

              <p>
                <button
                  className="btn btn-text-primary text-link"
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
        {errors?.[feature.dateable.id] && (
          <div
            className="alert alert-danger alert-validation-error mt-2"
            role="alert"
          >
            <div className="icon">
              <FontAwesomeIcon icon={faTriangleExclamation} />{" "}
            </div>

            <div className="content">{errors?.[feature.dateable.id]}</div>
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

  if (loading) {
    return <LoadingBar />;
  }

  if (error) {
    return <p>Error loading season data: {error.message}</p>;
  }

  return (
    <div className="page submit-dates">
      <FlashMessage
        title={flashTitle}
        message={flashMessage}
        isVisible={isFlashOpen}
        onClose={handleFlashClose}
      />
      <ConfirmationDialog
        title={title}
        message={message}
        notes={confirmationDialogNotes}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        isOpen={isConfirmationOpen}
      />
      <NavBack routePath={`/park/${parkId}`}>
        Back to {season?.park.name} season dates
      </NavBack>

      <header className="page-header internal">
        <h1>
          {season && `${season.park.name} ${season.operatingYear} season dates`}
        </h1>
      </header>

      {season && (
        <h2 className="sub-area-name">
          <FeatureIcon iconName={season.featureType.icon} />
          {season.featureType.name}
        </h2>
      )}

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
          <h2 className="mb-4">
            Notes
            {["approved", "published"].includes(season?.status) && (
              <span className="text-danger">*</span>
            )}
          </h2>

          <ChangeLogsList changeLogs={season?.changeLogs} />

          <p>
            If you are updating the current year’s dates, provide an explanation
            for why dates have changed. Provide any other notes about these
            dates if needed.
          </p>

          <div
            className={`form-group mb-4 ${errors?.notes ? "has-error" : ""}`}
          >
            <textarea
              className={classNames({
                "form-control": true,
                "is-invalid": errors?.notes,
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
            {errors?.notes && (
              <div className="error-message mt-2">{errors?.notes}</div>
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

export default SubmitDates;

SubmitDates.propTypes = {
  parkId: PropTypes.string,
  seasonId: PropTypes.string,
};
