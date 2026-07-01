import PropTypes from "prop-types";
import Select, { components } from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fa-kit/icons/classic/solid";

function SearchIndicator(props) {
  return (
    <components.DropdownIndicator {...props}>
      <FontAwesomeIcon icon={faMagnifyingGlass} />
    </components.DropdownIndicator>
  );
}

export default function ParkSearch({ options, value, onChange }) {
  return (
    <>
      <label htmlFor="park-name" className="form-label">
        Park name
      </label>
      <Select
        inputId="park-name"
        value={value}
        options={options}
        onChange={onChange}
        isClearable
        isSearchable
        placeholder="Search or select by park name"
        classNamePrefix="react-select"
        components={{
          DropdownIndicator: SearchIndicator,
          IndicatorSeparator: () => null,
        }}
      />
    </>
  );
}

ParkSearch.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.shape({
    value: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
  }),
  onChange: PropTypes.func.isRequired,
};
