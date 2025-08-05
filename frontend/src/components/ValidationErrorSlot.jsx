import PropTypes from "prop-types";

import { useValidationContext } from "@/hooks/useValidation/useValidation";

// Displays validation error messages in named areas of the UI
export default function ValidationErrorSlot({ element }) {
  const validation = useValidationContext();

  const errors = validation.groupedErrors[element] || [];

  if (!errors.length) return null;

  // Render all validation errors for this "element"
  return (
    <div className="text-danger validation-errors">
      {errors.map((error, index) => (
        <div key={index}>{error.message}</div>
      ))}
    </div>
  );
}

ValidationErrorSlot.propTypes = {
  element: PropTypes.string.isRequired,
};
