import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import walkInCamping from "../../assets/icons/walk-in-camping.svg";

import "./PageDetails.scss";

function PageDetails() {
  // @TODO: fetch park name + details
  const { parkId } = useParams();

  return (
    <div className="page page-details">
      <header className="page-header internal">
        <h1>Elk Falls Park #{parkId}</h1>
      </header>

      <section className="sub-area">
        <h2>
          <img src={walkInCamping} className="sub-area-icon" /> Frontcountry
          Camping
        </h2>

        <div className="season">
          <div className="details">
            <header>
              <h3>2025 season</h3>
              <span className="badge rounded-pill text-bg-warning">
                Requested
              </span>
              <button className="btn btn-text-primary expand-toggle">
                <span>Last updated: Never</span>
                <FontAwesomeIcon
                  className="append-content ms-2"
                  icon="fa-solid fa-chevron-down"
                />
              </button>
            </header>
          </div>

          <div className="controls">
            <button className="btn btn-text-primary">
              <FontAwesomeIcon
                className="append-content me-2"
                icon="fa-solid fa-pen"
              />
              <span>Edit</span>
            </button>
          </div>
        </div>

        <div className="season expanded">
          <div className="details expanded">
            <header>
              <h3>2024 season</h3>
              <span className="badge rounded-pill text-bg-success">
                Published
              </span>
              <button className="btn btn-text-primary expand-toggle">
                <span>Last updated: Never</span>
                <FontAwesomeIcon
                  className="append-content ms-2"
                  icon="fa-solid fa-chevron-up"
                />
              </button>
            </header>

            <div className="details-content">
              <h4>Alouette Campground</h4>

              <table className="table table-striped sub-area-dates">
                <tbody>
                  <tr>
                    <th scope="row">Operating dates</th>
                    <td>Mon, Mar 28 - Wed, Oct 15</td>
                  </tr>
                  <tr>
                    <th scope="row">Reservation dates</th>
                    <td>
                      Tue, Mar 28 - Wed, Apr 1<br />
                      Mon, May 1 - Wed, Oct 14
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4>Gold Creek Campground</h4>

              <table className="table table-striped sub-area-dates">
                <tbody>
                  <tr>
                    <th scope="row">Operating dates</th>
                    <td>Mon, Mar 28 - Wed, Oct 15</td>
                  </tr>
                  <tr>
                    <th scope="row">Reservation dates</th>
                    <td>
                      Tue, Mar 28 - Wed, Apr 1<br />
                      Mon, May 1 - Wed, Oct 14
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="controls">
            <button className="btn btn-text-primary">
              <FontAwesomeIcon
                className="append-content me-2"
                icon="fa-solid fa-pen"
              />
              <span>Edit</span>
            </button>

            <div className="divider"></div>

            <button className="btn btn-text-primary">
              <FontAwesomeIcon
                className="append-content me-2"
                icon="fa-solid fa-circle-exclamation"
              />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PageDetails;
