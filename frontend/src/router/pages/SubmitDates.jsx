import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  omit,
  mapValues,
  maxBy,
  minBy,
  cloneDeep,
  set as lodashSet,
} from "lodash";
import { differenceInCalendarDays } from "date-fns";
import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavBack from "@/components/NavBack";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import groupCamping from "@/assets/icons/group-camping.svg";
import { formatDateRange, formatTimestamp } from "@/lib/utils";
import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import PropTypes from "prop-types";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import "./SubmitDates.scss";

function SubmitDates() {
  const { parkId, seasonId } = useParams();

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState({});
  const [notes, setNotes] = useState("");
  const [readyToPublish, setReadyToPublish] = useState(false);

  const [showFlash, setShowFlash] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});
  // @TODO: Track if the form has been submitted, and validate on change after that
  const [formSubmitted, setFormSubmitted] = useState(false);

  function addError(fieldId, message) {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldId]: message,
    }));
    return false;
  }

  // Remove field key from errors
  function clearError(fieldId) {
    setErrors((prevErrors) => omit(prevErrors, fieldId));
  }

  // Returns true if innerStart and innerEnd are within outerStart and outerEnd
  function checkWithinRange(outerStart, outerEnd, innerStart, innerEnd) {
    return outerStart <= innerStart && outerEnd >= innerEnd;
  }

  // Calculates the extents of each date type for each campsite grouping
  function getDateExtents(datesObj = dates) {
    const mapped = mapValues(datesObj, (campsiteDates) =>
      mapValues(campsiteDates, (dateTypeDates) => {
        // Get the dateRange with the earliest start date for this campground & date type
        const minDateRange = minBy(
          dateTypeDates,
          (dateRange) => new Date(dateRange.startDate),
        );
        const minDate = minDateRange?.startDate
          ? new Date(minDateRange?.startDate)
          : null;

        // Get the dateRange with the latest end date for this campground & date type
        const maxDateRange = maxBy(
          dateTypeDates,
          (dateRange) => new Date(dateRange.endDate),
        );
        const maxDate = maxDateRange?.endDate
          ? new Date(maxDateRange.endDate)
          : null;

        return { minDate, maxDate };
      }),
    );

    return mapped;
  }

  // @TODO: import from an external module
  const validate = {
    notes(value = notes) {
      clearError("notes");

      if (!value && ["approved", "published"].includes(season.status)) {
        return addError(
          "notes",
          "Required when updating previously approved dates",
        );
      }

      return true;
    },

    dateRange({
      dateRange,
      start,
      startDateId,
      end,
      endDateId,
      datesObj = dates,
    }) {
      clearError(startDateId);
      clearError(endDateId);

      // If both dates are blank, ignore the range
      if (!start && !end) {
        return true;
      }

      // Both dates are required if one is set
      if (!start) {
        return addError(startDateId, "Enter a start date");
      }

      if (!end) {
        return addError(endDateId, "Enter an end date");
      }

      // Parse date strings
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Check if the start date is before the end date
      if (startDate > endDate) {
        return addError(
          endDateId,
          "Enter an end date that comes after the start date",
        );
      }

      const operatingYear = season.operatingYear;

      // Date must be within the year for that form
      if (
        startDate.getFullYear() !== operatingYear ||
        endDate.getFullYear() !== operatingYear
      ) {
        // startDate =< endDate check happens first, so the end date will never fail this check
        return addError(startDateId, `Enter dates for ${operatingYear} only`);
      }

      const dateType = dateRange.dateType.name;
      const { dateableId } = dateRange;

      const dateExtents = getDateExtents(datesObj);

      // Get the extent of dates for each type
      const operationExtent = dateExtents[dateableId].Operation;
      const reservationExtent = dateExtents[dateableId].Reservation;

      // Check if the reservation dates are within the operating dates
      // @TODO: Check for gaps if operating dates is non-contiguous
      const withinRange = checkWithinRange(
        operationExtent.minDate,
        operationExtent.maxDate,
        reservationExtent.minDate,
        reservationExtent.maxDate,
      );

      // Validate rules specific to Reservation dates
      if (dateType === "Reservation") {
        // Date selected is within the operating dates
        if (!withinRange) {
          return addError(
            endDateId,
            "Enter reservation dates that fall within the operating dates selected.",
          );
        }
      }

      // Validate rules specific to Operation dates
      if (dateType === "Operation") {
        // Date selected encompasses reservation dates
        if (!withinRange) {
          // @TODO: Highlight the latest extent instead of the one being changed
          return addError(
            endDateId,
            "Enter operating dates that are the same or longer than the reservation dates selected.",
          );
        }
      }

      // End date is one or more days after reservation end date
      const daysBetween = differenceInCalendarDays(
        operationExtent.maxDate,
        reservationExtent.maxDate,
      );

      // The "within range" check above will ensure that the operation end date
      // is after the reservation end date, so we only need to check the number of days between the them

      if (dateType === "Operation") {
        if (daysBetween < 1) {
          return addError(
            endDateId,
            "Operating end date must be one or more days after reservation end date.",
          );
        }
      }

      if (dateType === "Reservation") {
        if (daysBetween < 1) {
          return addError(
            endDateId,
            "Reservation end date must be one or more days before the operating end date.",
          );
        }
      }

      return true;
    },
  };

  // Validates all date ranges for a dateable feature from `dates`
  function validateFeatureDates(dateableId, datesObj = dates) {
    const dateableFeature = datesObj[dateableId];

    const dateTypeGroups = Object.values(dateableFeature);

    // Clear all errors for this dateable feature:
    // Build a list of all field IDs to clear from `errors`
    const fieldIds = dateTypeGroups.flatMap((dateRanges) =>
      dateRanges.flatMap((dateRange, index) => {
        const dateRangeId = `${dateRange.dateableId}-${dateRange.dateType.id}-${index}`;

        return [`start-date-${dateRangeId}`, `end-date-${dateRangeId}`];
      }),
    );

    // Remove any errors for this dateable feature before revalidating
    setErrors((prevErrors) => omit(prevErrors, fieldIds));

    const dateTypeGroupsValid = dateTypeGroups.every((dateRanges) =>
      // Loop over date ranges for the date type
      dateRanges.every((dateRange, index) =>
        validate.dateRange({
          dateRange,
          start: dateRange.startDate,
          startDateId: `start-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
          end: dateRange.endDate,
          endDateId: `end-date-${dateRange.dateableId}-${dateRange.dateType.id}-${index}`,
          datesObj,
        }),
      ),
    );

    return dateTypeGroupsValid;
  }

  function validateForm() {
    // Clear errors from previous validation
    setErrors({});

    // Validate notes
    if (!validate.notes()) return false;

    // Validate all dates:
    // Loop over dateable features from `dates` (campsite groupings)
    const dateableIds = Object.keys(dates);
    const validDates = dateableIds.every((dateableId) =>
      validateFeatureDates(dateableId),
    );

    // @TODO: Scroll the first error into view

    return validDates;
  }

  // Validates a date range, then its parent dateable feature
  function onUpdateDateRange({
    dateRange,
    start,
    startDateId,
    end,
    endDateId,
    // Allow overriding dates during state updates
    datesObj = dates,
  }) {
    const { dateableId } = dateRange;

    // Validate the date range that changed
    const rangeValid = validate.dateRange({
      dateRange,
      start,
      startDateId,
      end,
      endDateId,
      datesObj,
    });

    // If the changed dateRange is invalid, don't validate anything else
    if (!rangeValid) return false;

    // If the changed dateRange is valid, validate the whole campsite grouping feature
    // to resolve any inter-dependent date range validations.

    // @TODO: This unnecessarily validates the changed dateRange twice;
    // Consider refactoring to validate once, but only show relevant errors.

    return validateFeatureDates(dateableId, datesObj);
  }

  const { data, loading, error, fetchData } = useApiGet(`/seasons/${seasonId}`);
  const {
    sendData,
    // error: saveError, // @TODO: handle save errors
    loading: saving,
  } = useApiPost(`/seasons/${seasonId}/save/`);

  const navigate = useNavigate();

  async function submitChanges() {
    setFormSubmitted(true);

    // Validate form state before saving
    if (!validateForm()) {
      console.error("Form validation failed!", errors);
      throw new Error("Form validation failed");
    }

    if (notes !== "foo") {
      throw new Error(
        "validation passed, but returning false for debugging anyway",
      );
    }

    const payload = {
      notes,
      readyToPublish,
      dates: Object.values(dates).reduce(
        (acc, dateType) => acc.concat(dateType.Operation, dateType.Reservation),
        [],
      ),
    };

    const response = await sendData(payload);

    return response;
  }

  // are there changes to save?
  function hasChanges() {
    if (formSubmitted) {
      return true;
    }

    const datesChanged = Object.values(dates).some((dateType) =>
      dateType.Operation.concat(dateType.Reservation).some(
        (dateRange) => dateRange.changed,
      ),
    );

    return datesChanged || notes;
  }

  async function continueToPreview() {
    try {
      if (hasChanges()) {
        await submitChanges();
      }
      navigate(`/park/${parkId}/edit/${seasonId}/preview`);
    } catch (err) {
      console.error(err);
    }
  }

  async function saveAsDraft() {
    try {
      await submitChanges();
      setNotes("");
      fetchData();
      setShowFlash(true);
    } catch (err) {
      console.error(err);
    }
  }

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
    const newValue = value ? value.toISOString() : null;

    setDates((prevDates) => {
      const updatedDates = cloneDeep(prevDates); // Create a deep clone to avoid mutations

      lodashSet(updatedDates, [dateableId, dateType, index, key], newValue);

      // Mark the date range as changed
      lodashSet(updatedDates, [dateableId, dateType, index, "changed"], true);

      if (callback) {
        callback(updatedDates);
      }

      return updatedDates;
    });
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

    return (
      <div className="row dates-row operating-dates">
        <div className="col-lg-5">
          <div className="form-group">
            <label htmlFor={startDateId} className="form-label d-lg-none">
              Start date
            </label>
            <DatePicker
              id={startDateId}
              selected={dateRange.startDate}
              onChange={(date) => {
                updateDateRange(
                  dateRange.dateableId,
                  dateRange.dateType.name,
                  index,
                  "startDate",
                  date,
                  (updatedDates) => {
                    onUpdateDateRange({
                      dateRange,
                      start: date,
                      startDateId,
                      end: dateRange.endDate,
                      endDateId,
                      datesObj: updatedDates,
                    });
                  },
                );
              }}
              dateFormat="EEE, MMM d, yyyy"
            />

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
            <DatePicker
              id={endDateId}
              selected={dateRange.endDate}
              onChange={(date) => {
                updateDateRange(
                  dateRange.dateableId,
                  dateRange.dateType.name,
                  index,
                  "endDate",
                  date,
                  (updatedDates) => {
                    onUpdateDateRange({
                      dateRange,
                      start: dateRange.startDate,
                      startDateId,
                      end: date,
                      endDateId,
                      datesObj: updatedDates,
                    });
                  },
                );
              }}
              dateFormat="EEE, MMM d, yyyy"
            />

            {errors?.[endDateId] && (
              <div className="error-message mt-2">{errors?.[endDateId]}</div>
            )}
          </div>
        </div>
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
              Operating dates{" "}
              <div className="tooltip-container">
                <FontAwesomeIcon
                  className="append-content ms-1"
                  icon={faCircleInfo}
                />
                <span className="tooltip-text">
                  {season?.dateTypes.Operation.description}
                </span>
              </div>
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
                Reservation dates{" "}
                <div className="tooltip-container">
                  <FontAwesomeIcon
                    className="append-content ms-1"
                    icon={faCircleInfo}
                  />
                  <span className="tooltip-text">
                    {season?.dateTypes.Reservation.description}
                  </span>
                </div>
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
            startDate: PropTypes.string.isRequired,
            endDate: PropTypes.string.isRequired,
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
        title="Dates saved as draft"
        message={`${season?.operatingYear} season dates saved`}
        isVisible={showFlash}
        onClose={() => setShowFlash(false)}
        duration={3000}
      />
      <NavBack routePath={`/park/${parkId}`}>
        Back to {season?.park.name} season dates
      </NavBack>

      <header className="page-header internal">
        <h1>
          {season && `${season.park.name} ${season.operatingYear} season dates`}
        </h1>
      </header>

      <h2 className="sub-area-name">
        <img src={groupCamping} className="sub-area-icon" />{" "}
        {season?.featureType.name}
      </h2>

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
          <h2 className="mb-4">Notes</h2>

          {season?.changeLogs.map((changeLog) => (
            <p key={changeLog.id}>
              {changeLog.notes && (
                <span>
                  {changeLog.notes}
                  <br />
                </span>
              )}
              <span className="note-metadata">
                {changeLog.notes ? "" : "Submitted "}
                {formatTimestamp(changeLog.createdAt)} by {changeLog.user.name}
              </span>
            </p>
          ))}

          <p>
            If you are updating the current year’s dates, provide an explanation
            for why dates have changed. Provide any other notes about these
            dates if needed.
          </p>

          <div
            className={`form-group mb-4 ${errors?.notes ? "has-error" : ""}`}
          >
            <textarea
              className="form-control"
              id="notes"
              name="notes"
              rows="5"
              value={notes}
              onChange={(ev) => {
                setNotes(ev.target.value);
                validate.notes(ev.target.value);
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
            <button type="button" className="btn btn-outline-primary">
              Back
            </button>

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
