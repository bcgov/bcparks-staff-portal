import { useParams } from "react-router-dom";
import NavBack from "../../components/NavBack";
import walkInCamping from "../../assets/icons/walk-in-camping.svg";

import "./ReviewChanges.scss";

function ReviewChanges() {
  // @TODO: fetch park name + details
  const { parkId, seasonId } = useParams();

  return (
    <div className="page review-changes">
      <NavBack routePath={"/"}>Back to Elk Falls dates</NavBack>

      <header className="page-header internal">
        <h1>
          {parkId} {seasonId} season dates preview
        </h1>
      </header>

      <section className="sub-area">
        <h2>
          <img src={walkInCamping} className="sub-area-icon" /> Frontcountry
          Camping
        </h2>

        <h4>Alouette Campground</h4>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col">Type of date</th>
                <th scope="col">2024</th>
                <th scope="col">2025</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Operating</td>
                <td>
                  <div className="date-range">
                    <span className="date">Mon, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 15</span>
                  </div>
                </td>
                <td>
                  <div className="date-range">
                    <span className="date">Mon, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 15</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Reservation</td>
                <td>
                  <div className="date-range">
                    <span className="date">Tue, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, April 1</span>
                  </div>
                  <div className="date-range">
                    <span className="date">Mon, May 1 </span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 14</span>
                  </div>
                </td>
                <td>
                  <div className="date-range">
                    <span className="date">Tue, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, April 1</span>
                  </div>
                  <div className="date-range">
                    <span className="date">Mon, May 1 </span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 14</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4>Gold Creek Campground</h4>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col">Type of date</th>
                <th scope="col">2024</th>
                <th scope="col">2025</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Operating</td>
                <td>
                  <div className="date-range">
                    <span className="date">Mon, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 15</span>
                  </div>
                </td>
                <td>
                  <div className="date-range">
                    <span className="date">Mon, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 15</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Reservation</td>
                <td>
                  <div className="date-range">
                    <span className="date">Tue, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, April 1</span>
                  </div>
                  <div className="date-range">
                    <span className="date">Mon, May 1 </span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 14</span>
                  </div>
                </td>
                <td>
                  <div className="date-range">
                    <span className="date">Tue, Mar 28</span>
                    <span className="separator">–</span>
                    <span className="date">Wed, April 1</span>
                  </div>
                  <div className="date-range">
                    <span className="date">Mon, May 1 </span>
                    <span className="separator">–</span>
                    <span className="date">Wed, Oct 14</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="row notes">
        <div className="col-lg-6">
          <h2 className="mb-4">Notes</h2>

          <p>
            Extended the season earlier.
            <br />
            <span className="note-metadata">
              November 1, 2024 by Kate Mckenzie
            </span>
          </p>

          <p>
            <span className="note-metadata">
              Submitted November 1, 2024 by Joel Tang
            </span>
          </p>

          <p>
            Need to double check overlap with the stat holiday in May.
            <br />
            <span className="note-metadata">
              November 14, 2024 by Robert Fiddler
            </span>
          </p>

          <div className="form-group mb-4">
            <textarea
              className="form-control"
              id="notes"
              name="notes"
              rows="5"
            ></textarea>
          </div>

          <div className="alert alert-cta-contact mb-5" role="alert">
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

          <h2 className="mb-4">Ready to publish?</h2>

          <p>
            Are these dates ready to be made available to the public the next
            time dates are published? When turned off, it will be flagged and
            held in the ‘Approved’ state until it is marked ‘Ready to publish’.
            Approved dates are included in exported files.
          </p>

          <div className="form-check form-switch mb-4">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="ready-to-publish"
            />
            <label className="form-check-label" htmlFor="ready-to-publish">
              Ready to publish
            </label>
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

export default ReviewChanges;
