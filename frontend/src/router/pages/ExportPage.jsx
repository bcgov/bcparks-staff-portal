import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function ExportPage() {
  return (
    <div className="page export">
      <p>Select the format of your export:</p>

      <div className="row">
        <div className="col-md-6 col-lg-5">
          <fieldset className="mb-3">
            <legend className="append-required">Export type</legend>

            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="type"
                id="type-all-dates"
                value="all-dates"
              />
              <label className="form-check-label" htmlFor="type-all-dates">
                All dates
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="type"
                id="type-bcp-only"
                value="bcp-only"
              />
              <label className="form-check-label" htmlFor="type-bcp-only">
                BCP reservations only
              </label>
            </div>
          </fieldset>

          <fieldset className="mb-3">
            <legend className="append-required">Year</legend>

            <div className="input-with-append">
              <select id="year" className="form-select"></select>
              <FontAwesomeIcon
                className="append-content"
                icon="fa-solid fa-magnifying-glass"
              />
            </div>
          </fieldset>

          <fieldset className="mb-3">
            <legend className="append-required">Park features</legend>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="features"
                id="features-backcountry-camping"
                value="Backcountry camping"
              />
              <label
                className="form-check-label"
                htmlFor="features-backcountry-camping"
              >
                Backcountry camping
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="features"
                id="features-cabins-huts"
                value="Cabins and huts"
              />
              <label
                className="form-check-label"
                htmlFor="features-cabins-huts"
              >
                Cabins and huts
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="features"
                id="features-frontcountry-camping"
                value="Frontcountry camping"
              />
              <label
                className="form-check-label"
                htmlFor="features-frontcountry-camping"
              >
                Frontcountry camping
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="features"
                id="features-group-camping"
                value="Group camping"
              />
              <label
                className="form-check-label"
                htmlFor="features-group-camping"
              >
                Group camping
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="features"
                id="features-picnic-areas"
                value="Picnic areas"
              />
              <label
                className="form-check-label"
                htmlFor="features-picnic-areas"
              >
                Picnic areas
              </label>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                name="features"
                id="features-walk-in-camping"
                value="Walk-in camping"
              />
              <label
                className="form-check-label"
                htmlFor="features-walk-in-camping"
              >
                Walk-in camping
              </label>
            </div>
          </fieldset>

          <fieldset>
            <button className="btn btn-primary">Export report</button>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;
