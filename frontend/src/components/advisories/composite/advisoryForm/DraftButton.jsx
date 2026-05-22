import PropTypes from "prop-types";
import { Button } from "@/components/advisories/shared/button/Button";

export default function DraftButton({ onClick, hasLoader }) {
  return (
    <Button
      label="Save draft"
      styling="btn-outline-primary btn"
      onClick={onClick}
      hasLoader={hasLoader}
    />
  );
}

DraftButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  hasLoader: PropTypes.bool,
};
