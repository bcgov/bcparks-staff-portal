// Flag icon displayed when status is not "Ready to publish"
import { faFlag } from "@awesome.me/kit-c1c3245051/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import TooltipWrapper from "@/components/TooltipWrapper";

export default function NotReadyFlag({ show = true }) {
  if (!show) return null;
  return (
    <TooltipWrapper placement="top" content="Dates not ready to be made public">
      <span className="ms-2 text-danger not-ready-flag" aria-hidden="true">
        <FontAwesomeIcon icon={faFlag} />
      </span>
    </TooltipWrapper>
  );
}
// Prop validation
NotReadyFlag.propTypes = {
  show: PropTypes.bool,
};
