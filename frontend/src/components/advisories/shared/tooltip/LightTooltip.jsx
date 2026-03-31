import { useId } from "react";
import PropTypes from "prop-types";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import "./LightTooltip.css";

export default function LightTooltip({
  title,
  children,
  placement = "bottom",
}) {
  const id = useId();

  return (
    <OverlayTrigger
      placement={placement}
      overlay={
        <Tooltip id={id} className="light-tooltip">
          {title}
        </Tooltip>
      }
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
