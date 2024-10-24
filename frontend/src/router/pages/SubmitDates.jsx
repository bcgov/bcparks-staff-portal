import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavBack from "../../components/NavBack";
import groupCamping from "../../assets/icons/group-camping.svg";

import "./SubmitDates.scss";

function SubmitDates() {
  // @TODO: fetch park name + details
  const { parkId, seasonId } = useParams();

  function SubArea() {
    return (
      <section className="sub-area">
        <h3>Alouette groupsite</h3>

        <div className="row">
          <div className="col-md-6">
            <p>
              Operating dates{" "}
              <FontAwesomeIcon
                className="append-content"
                icon="fa-solid fa-circle-info"
              />
            </p>

            <p>Previous: Mon, Jun 7, 2025 - Wed, Sep 15, 2025</p>

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
                  />
                </div>
              </div>
            </div>

            <div className="row dates-row operating-dates">
              <div className="col-lg-5">
                <div className="form-group">
                  <label htmlFor="startDate1" className="form-label d-lg-none">
                    Start date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate1"
                    name="startDate1"
                  />
                </div>
              </div>

              <div className="d-none d-lg-block col-lg-1 text-center">
                <span>&ndash;</span>
              </div>

              <div className="col-lg-5">
                <div className="form-group">
                  <label htmlFor="endDate1" className="form-label d-lg-none">
                    End date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate1"
                    name="endDate1"
                  />
                </div>
              </div>
            </div>

            <p>
              <button className="btn btn-text-primary text-link">
                + Add more operating dates
              </button>
            </p>
          </div>

          <div className="col-md-6">
            <p>
              Reservation dates{" "}
              <FontAwesomeIcon
                className="append-content"
                icon="fa-solid fa-circle-info"
              />
            </p>

            <p>Previous: Mon, Jun 7, 2025 - Wed, Sep 15, 2025</p>

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
                  />
                </div>
              </div>
            </div>

            <p>
              <button className="btn btn-text-primary text-link">
                + Add more reservation dates
              </button>
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="page submit-dates">
      <NavBack routePath={"/"}>Back to Elk Falls dates</NavBack>

      <header className="page-header internal">
        <h1>
          Elk Falls Park #{parkId} / {seasonId} dates
        </h1>
      </header>

      <h2>
        <img src={groupCamping} className="sub-area-icon" /> Group Camping
      </h2>

      <p className="mb-5">
        <a href="#TODO:-holidays-link">View a list of all statutory holidays</a>
      </p>

      {/* TODO: connect to API data */}
      {Array.from({ length: 3 }).map((_, i) => (
        <SubArea key={i} />
      ))}

      <div className="row">
        <div className="col-lg-6">
          <h2 className="mb-4">Notes</h2>

          <p>
            If there is a change from previous years or updated date
            information, please provide information on what has changed.
          </p>

          <div className="form-group mb-4">
            <textarea
              className="form-control"
              id="notes"
              name="notes"
              rows="5"
            ></textarea>
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

          <div className="controls d-flex">
            <button type="button" className="btn btn-outline-primary">
              Back
            </button>

            <button type="button" className="btn btn-outline-primary">
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
