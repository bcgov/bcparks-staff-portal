import PropTypes from "prop-types";
import { useState, useRef } from "react";
import Overlay from "react-bootstrap/Overlay";
import Tooltip from "react-bootstrap/Tooltip";

export default function TooltipWrapper({
  placement = "right",
  content,
  children,
}) {
  const [show, setShow] = useState(false);
  const target = useRef(null);

  return (
    <>
      <button
        ref={target}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{ background: "none", border: "none", padding: 0 }}
        aria-label="More information"
      >
        {children}
      </button>

      <Overlay target={target.current} show={show} placement={placement}>
        {(props) => (
          <Tooltip id="overlay-example" {...props}>
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
