// Flag icon displayed when status is not "Ready to publish"
import { faFlag } from "@awesome.me/kit-c1c3245051/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
export default function NotReadyFlag({ show = true }) {
  if (!show) return null;
  return (
    <span className="ms-2 text-danger not-ready-flag" aria-hidden="true">
      <FontAwesomeIcon icon={faFlag} />
    </span>
  );
}
// Prop validation
NotReadyFlag.propTypes = {
  show: PropTypes.bool,
};
