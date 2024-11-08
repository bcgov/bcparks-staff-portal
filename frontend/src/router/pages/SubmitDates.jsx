import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavBack from "../../components/NavBack";
import groupCamping from "../../assets/icons/group-camping.svg";
import { formatDateRange, formatDate } from "../../lib/utils";

import "./SubmitDates.scss";

function SubmitDates() {
  const { parkId, seasonId } = useParams();

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);

  function submit() {
    if (!notes) {
      setError("Please provide notes");
    }

    const endpoint = `/api/seasons/${seasonId}/save/`;
    const data = {
      notes,
      dates: Object.values(dates).reduce(
        (acc, dateType) => acc.concat(dateType.Operation, dateType.Reservation),
        [],
      ),
    };

    console.log("submitting", data);
    console.log("to", endpoint);
  }

  useEffect(() => {
    const x = {
      id: 5,
      operatingYear: 2024,
      status: "under_review",
      featureType: {
        id: 2,
        name: "Group Camping",
      },
      park: {
        id: 2,
        name: "Mable Lake",
        orcs: "2",
      },
      dateTypes: {
        Operation: {
          id: 1,
          name: "Operation",
        },
        Reservation: {
          id: 2,
          name: "Reservation",
        },
      },
      campgrounds: [
        {
          id: 3,
          name: "Monashee",
          features: [
            {
              id: 5,
              name: "Monashee Campsites",
              hasReservations: true,
              campground: {
                id: 3,
                name: "Monashee",
              },
              dateable: {
                id: 5,
                currentSeasonDates: [
                  {
                    id: 17,
                    seasonId: 5,
                    startDate: "2022-05-01",
                    endDate: "2022-09-30",
                    dateType: {
                      id: 1,
                      name: "Operation",
                    },
                  },
                  {
                    id: 18,
                    seasonId: 5,
                    startDate: "2022-05-01",
                    endDate: "2022-09-30",
                    dateType: {
                      id: 2,
                      name: "Reservation",
                    },
                  },
                ],
                previousSeasonDates: [],
              },
            },
          ],
        },
        {
          id: 4,
          name: "Taylor Creek",
          features: [
            {
              id: 6,
              name: "Taylor Creek Campsites",
              hasReservations: true,
              campground: {
                id: 4,
                name: "Taylor Creek",
              },
              dateable: {
                id: 6,
                currentSeasonDates: [
                  {
                    id: 21,
                    seasonId: 5,
                    startDate: "2022-05-01",
                    endDate: "2022-09-30",
                    dateType: {
                      id: 1,
                      name: "Operation",
                    },
                  },
                  {
                    id: 22,
                    seasonId: 5,
                    startDate: "2022-05-01",
                    endDate: "2022-09-30",
                    dateType: {
                      id: 2,
                      name: "Reservation",
                    },
                  },
                ],
                previousSeasonDates: [],
              },
            },
          ],
        },
        {
          id: 5,
          name: "Trinity",
          features: [
            {
              id: 7,
              name: "Trinity Campsites",
              hasReservations: true,
              campground: {
                id: 5,
                name: "Trinity",
              },
              dateable: {
                id: 7,
                currentSeasonDates: [
                  {
                    id: 25,
                    seasonId: 5,
                    startDate: "2022-05-01",
                    endDate: "2022-09-30",
                    dateType: {
                      id: 1,
                      name: "Operation",
                    },
                  },
                  {
                    id: 26,
                    seasonId: 5,
                    startDate: "2022-05-01",
                    endDate: "2022-09-30",
                    dateType: {
                      id: 2,
                      name: "Reservation",
                    },
                  },
                ],
                previousSeasonDates: [],
              },
            },
          ],
        },
      ],
      features: [],
    };

    const currentSeasonDates = {};
    /**
     * {
     *    [dateableId]: {
     *      Operation: [
     *         {
     *            id: 1,
     *            seasonId: 3,
     *            startDate: "2022-05-01",
     *            endDate: "2022-09-30",
     *            dateableId: 1,
     *            dateType: {
     *              id: 1,
     *              name: "Operation",
     *            },
     *         }
     *      ],
     *      Reservation: [],
     *    }
     * }
     */

    x.campgrounds.forEach((campground) => {
      campground.features.forEach((feature) => {
        currentSeasonDates[feature.dateable.id] = {
          Operation: [],
          Reservation: [],
        };
        feature.dateable.currentSeasonDates.forEach((dateRange) => {
          currentSeasonDates[feature.dateable.id][dateRange.dateType.name].push(
            {
              ...dateRange,
              dateableId: feature.dateable.id,
            },
          );
        });

        delete feature.dateable.currentSeasonDates;
      });
    });

    x.features.forEach((feature) => {
      currentSeasonDates[feature.dateable.id] = {
        Operation: [],
        Reservation: [],
      };
      feature.dateable.currentSeasonDates.forEach((dateRange) => {
        currentSeasonDates[feature.dateable.id][dateRange.dateType.name].push({
          ...dateRange,
          dateableId: feature.dateable.id,
        });
      });

      delete feature.dateable.currentSeasonDates;
    });

    setSeason(x);
    setDates(currentSeasonDates);
  }, []);

  useEffect(() => {
    setError(null);
  }, [notes]);

  function addDateRange(dateType, dateableId) {
    setDates({
      ...dates,
      [dateableId]: {
        ...dates[dateableId],
        [dateType]: [
          ...dates[dateableId][dateType],
          {
            seasonId: season.id,
            startDate: null,
            endDate: null,
            dateableId,
            dateType: season.dateTypes[dateType],
          },
        ],
      },
    });
  }

  function updateDateRange(dateableId, dateType, index, key, value) {
    setDates({
      ...dates,
      [dateableId]: {
        ...dates[dateableId],
        [dateType]: dates[dateableId][dateType].map((dateRange, i) =>
          i === index ? { ...dateRange, [key]: value } : dateRange,
        ),
      },
    });
  }

  function removeDateRange(dateType, dateableId, index) {
    setDates({
      ...dates,
      [dateableId]: {
        ...dates[dateableId],
        [dateType]: dates[dateableId][dateType].filter((_, i) => i !== index),
      },
    });
  }

  function Campground({ campground }) {
    return (
      <section className="campground">
        <h2>{campground.name}</h2>
        {campground.features.map((feature) => (
          <Feature key={feature.id} feature={feature} />
        ))}
      </section>
    );
  }

  function DateRange({ dateRange, index }) {
    const [displayValue, setDisplayValue] = useState(
      formatDate(dateRange.startDate),
    );

    return (
      <div className="row dates-row operating-dates">
        <div className="col-lg-5">
          <div className="form-group">
            <label htmlFor="startDate0" className="form-label d-lg-none">
              Start date
            </label>
            <input
              type="date"
              className="form-control"
              id="startDate0"
              name="startDate0"
              min={`${season.operatingYear}-01-01`}
              max={`${season.operatingYear}-12-31`}
              value={displayValue}
              onFocus={() => setDisplayValue(dateRange.startDate)} // switch to actual date on focus
              onBlur={() => setDisplayValue(formatDate(dateRange.startDate))}
              onChange={(ev) => {
                const newDate = ev.target.value;

                setDisplayValue(newDate);
                updateDateRange(
                  dateRange.dateableId,
                  dateRange.dateType.name,
                  index,
                  "startDate",
                  ev.target.value,
                );
              }}
            />
          </div>
        </div>

        <div className="d-none d-lg-block col-lg-1 text-center">
          <span>&ndash;</span>
        </div>

        <div className="col-lg-5">
          <div className="form-group">
            <label htmlFor="endDate0" className="form-label d-lg-none">
              End date
            </label>
            <input
              type="date"
              className="form-control"
              id="endDate0"
              name="endDate0"
              value={dateRange.endDate}
              min={`${season.operatingYear}-01-01`}
              max={`${season.operatingYear}-12-31`}
              onChange={(ev) =>
                updateDateRange(
                  dateRange.dateableId,
                  dateRange.dateType.name,
                  index,
                  "endDate",
                  ev.target.value,
                )
              }
            />
          </div>
        </div>
      </div>
    );
  }

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
              <DateRange
                key={dateRange.id}
                dateRange={dateRange}
                index={index}
              />
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
                      <div
                        key={formatDateRange(dateRange)}
                        className={index > 0 ? "my-2" : "mb-2"}
                      >
                        {formatDateRange(dateRange)}
                      </div>
                    ))}
                </div>
              </div>

              {dates[feature.dateable.id]?.Reservation.map(
                (dateRange, index) => (
                  <DateRange
                    key={dateRange.id}
                    dateRange={dateRange}
                    index={index}
                  />
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

  return (
    <div className="page submit-dates">
      <NavBack routePath={`/park/${parkId}`}>
        Back to {season?.park.name} season dates
      </NavBack>

      <header className="page-header internal">
        <h1>
          {season && `${season.park.name} ${season.operatingYear} season dates`}
        </h1>
      </header>

      <h2>
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

      <div className="row">
        <div className="col-lg-6">
          <h2 className="mb-4">Notes</h2>

          <p>
            If there is a change from previous years or updated date
            information, please provide information on what has changed.
          </p>

          <div className={`form-group mb-4 ${error ? "has-error" : ""}`}>
            <textarea
              className="form-control"
              id="notes"
              name="notes"
              rows="5"
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
            ></textarea>
            {error && <div className="error-message mt-2">{error}</div>}
          </div>

          <div className="alert alert-cta-contact mb-4" role="alert">
            <p>
              <b>Questions?</b>
            </p>

            <p className="mb-0">
              Missing an area or it needs adjustment?
              <br />
              For any question, please contact{" "}
              <a href="mailto:parksweb@bcparks.ca">parksweb@bcparks.ca</a>
            </p>
          </div>

          <div className="mb-12">
            <h2 className="mb-4">Ready to publish?</h2>

            <p>
              Are these dates ready to be made available to the public the next
              time dates are published? When turned off, it will be flagged and
              held in the ‘Approved’ state until it is marked ‘Ready to
              publish’. Approved dates are included in exported files.
            </p>
          </div>

          <div className="controls d-flex">
            <button type="button" className="btn btn-outline-primary">
              Back
            </button>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={submit}
            >
              Save draft
            </button>

            <button type="button" className="btn btn-primary">
              Continue to preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitDates;
