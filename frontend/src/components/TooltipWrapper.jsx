import PropTypes from "prop-types";
import { useState, useRef, useId } from "react";
import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";

export default function TooltipWrapper({
  placement = "right",
  content,
  children,
}) {
  const [show, setShow] = useState(false);
  const target = useRef(null);
  const tooltipId = useId();

  return (
    <>
      <span
        ref={target}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </span>

      <Overlay target={target.current} show={show} placement={placement}>
        {(props) => (
          <Tooltip id={tooltipId} {...props}>
            {content}
          </Tooltip>
        )}
      </Overlay>
    </>
  );
}

// prop validation
TooltipWrapper.propTypes = {
  content: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  placement: PropTypes.string,
};
