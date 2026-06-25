import PropTypes from "prop-types";

import { useValidationContext } from "@/hooks/useValidation/useValidation";

// Displays validation error messages in named areas of the UI
export default function ValidationErrorSlot({ elementId }) {
  const validation = useValidationContext();

  const errors = validation.groupedErrors[elementId] || [];

  if (!errors.length) return null;

  // Render all validation errors for this "element"
  return (
    <div
      className="text-danger validation-errors my-2"
      data-error-slot-id={elementId}
    >
      {errors.map((error) => (
        <div key={`${error.id}-${error.message}`}>{error.message}</div>
      ))}
    </div>
  );
}

ValidationErrorSlot.propTypes = {
  elementId: PropTypes.string.isRequired,
};
