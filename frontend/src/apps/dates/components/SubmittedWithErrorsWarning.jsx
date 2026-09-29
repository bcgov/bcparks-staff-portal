// Warning icon displayed when a season has been submitted but has validation errors
import { faTriangleExclamation } from "@fa-kit/icons/classic/solid";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import IconWithTooltip from "@/apps/dates/components/IconWithTooltip";

export default function SubmittedWithErrorsWarning({ show = true }) {
  const { t } = useTranslation("doot");

  if (!show) return null;
  return (
    <IconWithTooltip
      icon={faTriangleExclamation}
      tooltip={t("seasonStatus.submittedWithErrorsWarning.tooltip")}
      className="ms-2 text-danger"
    />
  );
}
// Prop validation
SubmittedWithErrorsWarning.propTypes = {
  show: PropTypes.bool,
};
