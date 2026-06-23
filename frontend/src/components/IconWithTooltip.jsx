import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import TooltipWrapper from "@/components/TooltipWrapper";

export default function IconWithTooltip({ icon, tooltip, className }) {
  return (
    <TooltipWrapper placement="top" content={tooltip}>
      <span className={className} aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>
    </TooltipWrapper>
  );
}

IconWithTooltip.propTypes = {
  icon: PropTypes.object.isRequired,
  tooltip: PropTypes.string.isRequired,
  className: PropTypes.string,
};
