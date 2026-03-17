import PropTypes from "prop-types";
import "./FormContainer.scss";

export default function FormContainer({ children }) {
  return (
    <div className="form-container mb-4">
      <h4>BC Parks Reservations</h4>
      <p>This information is used to set up the reservation system</p>
      {children}
    </div>
  );
}

FormContainer.propTypes = {
  children: PropTypes.node,
};
