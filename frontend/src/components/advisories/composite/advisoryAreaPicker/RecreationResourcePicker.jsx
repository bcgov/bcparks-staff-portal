import PropTypes from "prop-types";
import Select, { components } from "react-select";
import Badge from "react-bootstrap/Badge";
import "./RecreationResourcePicker.scss";

function getRecreationResourceMeta(option) {
  const resource = option?.obj || {};
  const name = resource.resourceName || "";
  const recId = resource.recResourceId || "";
  const community = resource.closestCommunity || "";
  const resourceType = resource.recreationResourceType?.resourceType || "";

  return {
    name,
    recId,
    subtitle: [resourceType, community].filter(Boolean).join(" • "),
  };
}

function RecreationResourceOption(props) {
  const { name, recId, subtitle } = getRecreationResourceMeta(props.data);

  return (
    <components.Option {...props}>
      <div className="recreation-resource">
        <div className="recreation-resource__left">
          {/* TODO: replace with icon */}
          <span className="recreation-resource__icon" aria-hidden="true"></span>
          <div className="recreation-resource__text">
            <div className="recreation-resource__name">{name}</div>
            {subtitle && (
              <div className="recreation-resource__subtitle">{subtitle}</div>
            )}
          </div>
        </div>
        {recId && (
          <Badge pill bg="info" className="recreation-resource__id">
            {recId}
          </Badge>
        )}
      </div>
    </components.Option>
  );
}

RecreationResourceOption.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    obj: PropTypes.shape({
      resourceName: PropTypes.string,
      recResourceId: PropTypes.string,
      closestCommunity: PropTypes.string,
      recreationResourceType: PropTypes.shape({
        resourceType: PropTypes.string,
      }),
    }),
  }),
};

export default function RecreationResourcePicker({ options, value, onChange }) {
  return (
    <Select
      options={options}
      value={value}
      onChange={(e) => onChange(e || [])}
      placeholder="Select Recreation Sites and Trails recreation resource(s)"
      isMulti
      className="bcgov-select"
      classNamePrefix="recreation-resource-select"
      components={{ Option: RecreationResourceOption }}
      menuIsOpen
    />
  );
}

RecreationResourcePicker.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
};

RecreationResourcePicker.defaultProps = {
  value: [],
};
