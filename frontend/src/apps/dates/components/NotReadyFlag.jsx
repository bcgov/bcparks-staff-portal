// Flag icon displayed when status is not "Ready to publish"
import { faFlag } from "@awesome.me/kit-c1c3245051/icons/classic/solid";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import IconWithTooltip from "@/apps/dates/components/IconWithTooltip";

export default function NotReadyFlag({ show = true }) {
  const { t } = useTranslation("doot");

  if (!show) return null;
  return (
    <IconWithTooltip
      icon={faFlag}
      tooltip={t("seasonStatus.notReadyFlag.tooltip")}
      className="ms-2 text-danger not-ready-flag"
    />
  );
}
// Prop validation
NotReadyFlag.propTypes = {
  show: PropTypes.bool,
};
