// Flag icon displayed when status is not "Ready to publish"
import { faFlag } from "@awesome.me/kit-c1c3245051/icons/classic/solid";
import PropTypes from "prop-types";
import IconWithTooltip from "@/components/IconWithTooltip";

export default function NotReadyFlag({ show = true }) {
  if (!show) return null;
  return (
    <IconWithTooltip
      icon={faFlag}
      tooltip="Dates not ready to be made public"
      className="ms-2 text-danger not-ready-flag"
    />
  );
}
// Prop validation
NotReadyFlag.propTypes = {
  show: PropTypes.bool,
};
