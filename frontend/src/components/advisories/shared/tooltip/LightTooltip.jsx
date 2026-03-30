import PropTypes from "prop-types";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import "./LightTooltip.css";

export default function LightTooltip({ title, children, placement = "bottom" }) {
  return (
    <OverlayTrigger
      placement={placement}
      overlay={<Tooltip className="light-tooltip">{title}</Tooltip>}
    >
      <span className="d-inline-flex align-items-center">{children}</span>
    </OverlayTrigger>
  );
}

LightTooltip.propTypes = {
  children: PropTypes.node.isRequired,
  placement: PropTypes.string,
  title: PropTypes.node.isRequired,
};
