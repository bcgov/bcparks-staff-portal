// Warning icon displayed when a season has been submitted but has validation errors
import { faTriangleExclamation } from "@fa-kit/icons/classic/solid";
import PropTypes from "prop-types";
import IconWithTooltip from "@/components/IconWithTooltip";

export default function SubmittedWithErrorsWarning({ show = true }) {
  if (!show) return null;
  return (
    <IconWithTooltip
      icon={faTriangleExclamation}
      tooltip="Submitted with errors"
      className="ms-2 text-danger"
    />
  );
}
// Prop validation
SubmittedWithErrorsWarning.propTypes = {
  show: PropTypes.bool,
};
