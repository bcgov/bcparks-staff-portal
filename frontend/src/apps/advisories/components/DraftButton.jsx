import PropTypes from "prop-types";
import { ActionButton } from "@/components/ActionButton";

export default function DraftButton({ onClick, hasLoader }) {
  return (
    <ActionButton
      label="Save draft"
      variant="secondary"
      onClick={onClick}
      hasLoader={hasLoader}
    />
  );
}

DraftButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  hasLoader: PropTypes.bool,
};
