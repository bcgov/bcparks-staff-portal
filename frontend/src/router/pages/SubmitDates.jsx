import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cloneDeep, set as lodashSet } from "lodash";
import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavBack from "@/components/NavBack";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import groupCamping from "@/assets/icons/group-camping.svg";
import { formatDateRange } from "@/lib/utils";
import LoadingBar from "@/components/LoadingBar";
import FlashMessage from "@/components/FlashMessage";
import ChangeLogs from "@/components/ChangeLogs";
import useValidation from "@/hooks/useValidation";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import PropTypes from "prop-types";

import { useApiGet, useApiPost } from "@/hooks/useApi";
import "./SubmitDates.scss";
import classNames from "classnames";

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

  const [showFlash, setShowFlash] = useState(false);

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
              className={classNames({
                "form-control": true,
                "is-invalid": errors?.[startDateId],
              })}
              selected={dateRange.startDate}
              onChange={(date) => {
                updateDateRange(
                  dateRange.dateableId,
                  dateRange.dateType.name,
                  index,
                  "startDate",
                  date,
                  // Callback to validate the new value
                  (updatedDates) => {
                    onUpdateDateRange({
                      dateRange,
                      datesObj: updatedDates,
                    });
                  },
                );
              }}
              dateFormat="EEE, MMM d, yyyy"
            />

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
            <DatePicker
              id={endDateId}
              className={classNames({
                "form-control": true,
                "is-invalid": errors?.[endDateId],
              })}
              selected={dateRange.endDate}
              onChange={(date) => {
                updateDateRange(
                  dateRange.dateableId,
                  dateRange.dateType.name,
                  index,
                  "endDate",
                  date,
                  // Callback to validate the new value
                  (updatedDates) => {
                    onUpdateDateRange({
                      dateRange,
                      datesObj: updatedDates,
                    });
                  },
                );
              }}
              dateFormat="EEE, MMM d, yyyy"
            />

            {/* Show validation errors for the endDate field */}
            {errors?.[endDateId] && (
              <div className="error-message mt-2">{errors?.[endDateId]}</div>
            )}
          </div>
        </div>

        {/* Show validation errors for the date range */}
        {errors?.[dateRangeId] && (
          <div className="error-message mt-2">{errors?.[dateRangeId]}</div>
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
              Operating dates{" "}
              {season?.dateTypes?.Operation?.description && (
                <div className="tooltip-container">
                  <FontAwesomeIcon
                    className="append-content ms-1"
                    icon={faCircleInfo}
                  />
                  <span className="tooltip-text">
                    {season.dateTypes.Operation.description}
                  </span>
                </div>
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
                Reservation dates{" "}
                {season?.dateTypes?.Reservation?.description && (
                  <div className="tooltip-container">
                    <FontAwesomeIcon
                      className="append-content ms-1"
                      icon={faCircleInfo}
                    />
                    <span className="tooltip-text">
                      {season.dateTypes.Reservation.description}
                    </span>
                  </div>
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

          {/* Show validation errors for the whole dateable feature */}
          <div className="error-message mt-2">
            {errors?.[feature.dateable.id]}
          </div>
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

          <ChangeLogs changeLogs={season?.changeLogs} />

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
