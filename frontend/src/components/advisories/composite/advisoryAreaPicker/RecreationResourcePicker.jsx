import PropTypes from "prop-types";
import Select, { components } from "react-select";
import Badge from "react-bootstrap/Badge";
import { RESOURCE_TYPE_ICONS } from "@/constants/resourceTypeIcon";
import "./RecreationResourcePicker.scss";

function getRecreationResourceMeta(option) {
  const resource = option?.obj || {};
  const name = resource.resourceName || "";
  const recId = resource.recResourceId || "";
  const community = resource.closestCommunity || "";
  const recreationResourceType = resource?.recreationResourceType || {};
  const resourceType = recreationResourceType.resourceType || "";
  const resourceTypeCode = recreationResourceType.resourceTypeCode || "";
  const icon =
    RESOURCE_TYPE_ICONS[resourceTypeCode] || RESOURCE_TYPE_ICONS.NO_TYPE;

  return {
    name,
    recId,
    icon,
    resourceType,
    subtitle: [resourceType, community].filter(Boolean).join(" • "),
  };
}

function highlightMatch(text, query) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());

  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <strong>{text.slice(index, index + query.length)}</strong>
      {text.slice(index + query.length)}
    </>
  );
}

function RecreationResourceOption(props) {
  const { name, recId, subtitle, icon, resourceType } =
    getRecreationResourceMeta(props.data);

  const inputValue = props.selectProps?.inputValue || "";

  return (
    <components.Option {...props}>
      <div className="recreation-resource">
        <div className="recreation-resource__left">
          <img
            src={icon}
            alt={resourceType}
            className="recreation-resource__icon"
          />
          <div className="recreation-resource__text">
            <div className="recreation-resource__name">
              {highlightMatch(name, inputValue)}
            </div>
            {subtitle && (
              <div className="recreation-resource__subtitle">{subtitle}</div>
            )}
          </div>
        </div>
        {recId && (
          <Badge pill bg="info" className="recreation-resource__id">
            {highlightMatch(recId, inputValue)}
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
        resourceTypeCode: PropTypes.string,
      }),
    }),
  }),
  selectProps: PropTypes.shape({
    inputValue: PropTypes.string,
  }),
};

export default function RecreationResourcePicker({ options, value, onChange }) {
  return (
    <Select
      inputId="resources"
      options={options}
      maxHeight={200}
      value={value}
      onChange={(e) => onChange(e || [])}
      placeholder="Search by name or number"
      isMulti
      className="bcgov-select"
      classNamePrefix="recreation-resource-picker"
      components={{ Option: RecreationResourceOption }}
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
