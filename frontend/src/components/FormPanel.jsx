import PropTypes from "prop-types";
import classNames from "classnames";
import Form from "react-bootstrap/Form";
import Offcanvas from "react-bootstrap/Offcanvas";
import FormContainer from "@/components/FormContainer";
// import DateRangeForm from "@/components/DateRangeForm";
import "./FormPanel.scss";

// Components
function RadioButtons({ id }) {
  return (
    <Form className="mb-4">
      <Form.Check id={`${id}--yes`} type="radio" label="Yes" />
      <Form.Check id={`${id}--yes`} type="radio" label="No" />
    </Form>
  );
}

RadioButtons.propTypes = {
  id: PropTypes.string,
};

function InternalNotes({ errors = {}, notes = "", setNotes }) {
  return (
    <div className="mb-4">
      <h3>Internal notes</h3>
      <p>
        If you are updating the current year&apos;s dates, provide an
        explanation for why dates have changed. Provide any other notes about
        these dates if needed.
      </p>
      <div className={`form-group mb-2 ${errors.notes ? "has-error" : ""}`}>
        <textarea
          id="internal-notes"
          rows="5"
          name="notes"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
          }}
          className={classNames({
            "form-control": true,
            "is-invalid": errors.notes,
          })}
        ></textarea>
      </div>
      <div>
        <small>Visible to all BC Parks staff and Park Operators</small>
      </div>
    </div>
  );
}

InternalNotes.propTypes = {
  errors: PropTypes.object,
  notes: PropTypes.string,
  setNotes: PropTypes.func,
};

function Buttons({ onSave, onSubmit, approver }) {
  return (
    <div>
      <button className="btn btn-outline-primary me-3" onClick={onSave}>
        Save draft
      </button>
      {approver ? (
        <button className="btn btn-primary" onClick={onSubmit}>
          Mark approved
        </button>
      ) : (
        <button className="btn btn-primary" onClick={onSubmit}>
          Submit to HQ
        </button>
      )}
    </div>
  );
}

Buttons.propTypes = {
  onSave: PropTypes.func,
  onSubmit: PropTypes.func,
  approver: PropTypes.bool,
};

function FormPanel({ show, setShow, formData, approver }) {
  // Constants
  const data = formData || {};
  const currentYear = new Date().getFullYear();

  // Functions
  function handleClose() {
    setShow(false);
  }

  // console.log("DATA", data);

  return (
    <Offcanvas
      show={show}
      backdrop="static"
      onHide={handleClose}
      placement="end"
      className="form-panel"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          <h2>{data.name}</h2>
          <h2 className="fw-normal">{currentYear} dates</h2>
          <p className="fw-normal">
            <a
              href="https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays"
              target="_blank"
            >
              View a list of all statutory holidays
            </a>
          </p>
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <h3>Public information</h3>
        <p>This information is displayed on bcpark.ca</p>
        {/* park */}
        {data.level === "park" && (
          <>
            {data.seasons.length > 0 && (
              <FormContainer>
                {/* TODO: tier 1 form */}
                {data.hasTier1Dates && (
                  <div>
                    <p>This park has Tier 1 dates.</p>
                    {/* <DateRangeForm /> */}
                  </div>
                )}
                {/* TODO: tier 2 form */}
                {data.hasTier2Dates && (
                  <div>
                    <p>This park has Tier 2 dates.</p>
                    {/* <DateRangeForm /> */}
                  </div>
                )}
                {/* TODO: winter fee form */}
              </FormContainer>
            )}
            <h6 className="fw-normal">Park gate</h6>
            <p>
              Does this park have a single gated vehicle entrance? If there are
              multiple vehicle entrances, select &quot;No&quot;.
            </p>
            <RadioButtons id="park-gate" />
            {/* TODO: display Operating dates if hasGate is true or if it has Operating dates */}
            {data.groupedDateRanges?.Operation[currentYear].length > 0 && (
              <div>
                <p>This park operating dates.</p>
                {/* <DateRangeForm /> */}
              </div>
            )}
          </>
        )}
        {/* park area */}
        {data.level === "park-area" && (
          <>
            {data.features.length > 0 && (
              <FormContainer>
                {data.features.map((feature) => (
                  <div key={feature.id}>
                    {feature.groupedDateRanges &&
                      Object.entries(feature.groupedDateRanges).map(
                        ([dateTypeName, yearObj]) =>
                          Object.entries(yearObj).map(([year, dateRanges]) =>
                            dateRanges.map((dateRange) => (
                              <div key={dateRange.id}>
                                <h6 className="fw-normal">{dateTypeName}</h6>
                                {/* TODO: dates form */}
                                {/* <DateRangeForm /> */}
                              </div>
                            )),
                          ),
                      )}
                  </div>
                ))}
              </FormContainer>
            )}
            <h6 className="fw-normal">{data.name} gate</h6>
            <p>Does {data.name} have a gated entrance?</p>
            <RadioButtons id="park-area-gate" />
          </>
        )}
        {/* feature */}
        {data.level === "feature" && (
          <>
            <FormContainer>
              <h5>{data.name}</h5>
              {data.groupedDateRanges &&
                Object.entries(data.groupedDateRanges).map(
                  ([dateTypeName, yearObj]) =>
                    Object.entries(yearObj).map(([year, dateRanges]) =>
                      dateRanges.map((dateRange) => (
                        <div key={dateRange.id}>
                          <h6 className="fw-normal">{dateTypeName}</h6>
                        </div>
                      )),
                    ),
                )}
            </FormContainer>
            <h6 className="fw-normal">{data.name} gate</h6>
            <p>Does {data.name} have a gated entrance?</p>
            <RadioButtons id="feature-gate" />
          </>
        )}

        {/* TODO: add Public Notes for v3 */}
        {/* TODO: add Ready to Publish for approver */}
        {/* {approver && <ReadyToPublishBox />} */}
        <InternalNotes />
        <Buttons approver={approver} />
      </Offcanvas.Body>
    </Offcanvas>
  );
}

export default FormPanel;

FormPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  formData: PropTypes.object,
  approver: PropTypes.bool,
};
