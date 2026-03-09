import React from "react";
import PropTypes from "prop-types";
import "./VisibilityToggle.css";
import ToggleButton from "@mui/material/ToggleButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function VisibilityToggle({
  toggle: { toggleState, setToggleState },
}) {
  return (
    <div>
      <ToggleButton
        value="check"
        selected={toggleState}
        onChange={() => {
          setToggleState(!toggleState);
        }}
      >
        {toggleState && <VisibilityIcon className="visibilityIcon" />}
        {!toggleState && <VisibilityOffIcon className="visibilityIcon" />}
      </ToggleButton>
    </div>
  );
}

VisibilityToggle.propTypes = {
  toggle: PropTypes.shape({
    toggleState: PropTypes.bool.isRequired,
    setToggleState: PropTypes.func.isRequired,
  }).isRequired,
};
