import PropTypes from "prop-types";
import Offcanvas from "react-bootstrap/Offcanvas";
import "./FormPanel.scss";

function FormPanel({ show, setShow, formData }) {
  // Constants
  const data = formData || {};
  const currentYear = new Date().getFullYear();

  // Functions
  function handleClose() {
    setShow(false);
  }

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
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body></Offcanvas.Body>
    </Offcanvas>
  );
}

export default FormPanel;

FormPanel.propTypes = {
  show: PropTypes.bool.isRequired,
  setShow: PropTypes.func.isRequired,
  formData: PropTypes.object,
};
