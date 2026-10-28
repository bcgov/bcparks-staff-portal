import PropTypes from "prop-types";
import * as DATE_TYPE from "@/apps/dates/constants/dateType";
import "./FormContainer.scss";

export default function FormContainer({ children, dateType = null }) {
  const description =
    dateType?.dateTypeNumber === DATE_TYPE.WINTER_FEE
      ? "Enter the dates where the winter fee is collected for overnight camping, for FCFS and reservable camping. Dates will be posted on the park page and entered into the reservation service."
      : "This information is used to set up the reservation system";

  return (
    <div className="form-container mb-4">
      <h4>BC Parks Reservations</h4>
      <p>{description}</p>
      {children}
    </div>
  );
}

FormContainer.propTypes = {
  children: PropTypes.node,
  dateType: PropTypes.shape({
    dateTypeNumber: PropTypes.number,
  }),
};
