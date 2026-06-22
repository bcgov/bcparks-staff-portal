import { useMemo } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/advisories/shared/button/Button";
import useAccess from "@/hooks/useAccess";
import { ROLES } from "@/config/permissions";

export default function PrimaryActions({
  mode,
  advisoryStatusCode,
  isUrgent = false,
  isApprover = false,
  onPublish,
  onSubmit,
  isSubmitting,
}) {
  const { hasAnyRole } = useAccess();

  // Allow users to publish/update directly if it's "urgent" (weekend/after hours),
  // or if they are an approver, or if they have permission to publish without approval.
  const canPublish =
    isUrgent ||
    isApprover ||
    hasAnyRole([ROLES.ADVISORY_PUBLISH_WITHOUT_APPROVAL]);

  // Use the published/scheduled states to decide whether this action is creating or updating public content
  const publishButtonLabel = useMemo(() => {
    if (
      (advisoryStatusCode === "SCH" || advisoryStatusCode === "PUB") &&
      mode !== "create"
    ) {
      return "Update advisory / closure";
    }

    return "Create advisory / closure";
  }, [mode, advisoryStatusCode]);

  if (!hasAnyRole([ROLES.ADVISORY_SUBMITTER, ROLES.ADVISORY_APPROVER])) {
    return null;
  }

  if (!canPublish) {
    // Show a button to submit for review if the user can't publish directly
    return (
      <Button
        label="Submit for review"
        styling="btn-primary btn"
        onClick={onSubmit}
        hasLoader={isSubmitting}
      />
    );
  }

  // Show a button to update directly if the user has permission
  return (
    <Button
      label={publishButtonLabel}
      styling="btn-primary btn"
      onClick={onPublish}
      hasLoader={isSubmitting}
    />
  );
}

PrimaryActions.propTypes = {
  mode: PropTypes.string.isRequired,
  advisoryStatusCode: PropTypes.string,
  onPublish: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isUrgent: PropTypes.bool,
  isApprover: PropTypes.bool,
};
