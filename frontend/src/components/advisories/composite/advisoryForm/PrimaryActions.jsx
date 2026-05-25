import { useMemo } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/advisories/shared/button/Button";
import useAccess from "@/hooks/useAccess";
import { ROLES } from "@/config/permissions";

export default function PrimaryActions({
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
  const publishButtonLabel = useMemo(
    () =>
      advisoryStatusCode === "SCH" || advisoryStatusCode === "PUB"
        ? "Update advisory / closure"
        : "Create advisory / closure",
    [advisoryStatusCode],
  );

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
  advisoryStatusCode: PropTypes.string,
  onPublish: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isUrgent: PropTypes.bool,
  isApprover: PropTypes.bool,
};
