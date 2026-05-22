import PropTypes from "prop-types";
import { Button } from "@/components/advisories/shared/button/Button";
import useAccess from "@/hooks/useAccess";
import { ROLES } from "@/config/permissions";

export default function PrimaryActions({
  mode,
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

  if (mode === "create") {
    return canPublish ? (
      // Show a button to publish directly if the user has permission
      <Button
        label="Create advisory / closure"
        styling="btn-primary btn"
        onClick={onPublish}
        hasLoader={isSubmitting}
      />
    ) : (
      // Show a button to submit for review if the user can't publish directly
      <Button
        label="Submit for review"
        styling="btn-primary btn"
        onClick={onSubmit}
        hasLoader={isSubmitting}
      />
    );
  }

  if (mode === "update") {
    return canPublish ? (
      // Show a button to update directly if the user has permission
      <Button
        label="Update advisory / closure"
        styling="btn-primary btn"
        onClick={onPublish}
        hasLoader={isSubmitting}
      />
    ) : (
      // Show a button to submit for review if the user can't update directly
      <Button
        label="Submit for review"
        styling="btn-primary btn"
        onClick={onSubmit}
        hasLoader={isSubmitting}
      />
    );
  }

  return null;
}

PrimaryActions.propTypes = {
  mode: PropTypes.string.isRequired,
  onPublish: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  isUrgent: PropTypes.bool,
  isApprover: PropTypes.bool,
};
