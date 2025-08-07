import { createContext, useContext, useCallback, useMemo } from "react";
import { groupBy } from "lodash-es";
import validGateTime from "./rules/validGateTime.js";
import hasGateChosen from "./rules/hasGateChosen.js";
import requiredDateRanges from "./rules/requiredDateRanges.js";
import startDateBeforeEndDate from "./rules/startDateBeforeEndDate.js";
import dateInOperatingYear from "./rules/dateInOperatingYear.js";
import noOverlapPrevious from "./rules/noOverlapPrevious.js";
import changeNoteRequired from "./rules/changeNoteRequired.js";

// Constants for named "validation error slots" in the UI
const elements = {
  // Under the "Has gate? Yes/No" radio buttons
  HAS_GATE: "hasGate",

  // Under the gate hours time range inputs
  GATE_TIMES: "gateTimes",

  // Under the "internal notes" textarea
  INTERNAL_NOTES: "internalNotes",
};

/**
 * Synchronously validates the form data.
 * Called automatically by the useValidate hook, or manually by the validateForm method.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} seasonContext Extra context for validation, including:
 * - level: "park", "park-area", or "feature"
 * - submitted: boolean indicating if the form has been submitted
 * - notes: internal notes text
 * @returns {Array} Array of validation error objects
 */
function validate(seasonData, seasonContext) {
  const errors = [];

  // Return "valid" with no errors if the seasonData isn't loaded yet
  if (!seasonData || !seasonContext) return errors;

  // We'll add validation data to the seasonContext
  // and pass it to all the validation rules
  const validationContext = { ...seasonContext };

  // Add the element name constants to the context
  // (Used to name the validation error elements)
  validationContext.elements = elements;

  // Provide a method to add validation errors in the context
  validationContext.addError = (element, message) => {
    errors.push({ element, message });
  };

  // Flatten the date ranges for looping in validation
  const dateRanges = [];

  const { level } = validationContext;
  const { current } = seasonData;

  if (level === "park") {
    dateRanges.push(...current.park.dateable.dateRanges);
  } else if (level === "park-area") {
    // For parkArea-level forms, don't include any parkArea-level dates,
    // just include all feature-level dates within the parkArea.
    const featureDateRanges = current.parkArea.features.flatMap(
      (feature) => feature.dateable.dateRanges,
    );

    dateRanges.push(...featureDateRanges);
  } else if (level === "feature") {
    dateRanges.push(...current.feature.dateable.dateRanges);
  }

  validationContext.dateRanges = dateRanges;

  // Call the validation rules on the season data
  validGateTime(seasonData, validationContext);
  hasGateChosen(seasonData, validationContext);
  requiredDateRanges(seasonData, validationContext);
  startDateBeforeEndDate(seasonData, validationContext);
  dateInOperatingYear(seasonData, validationContext);
  noOverlapPrevious(seasonData, validationContext);
  changeNoteRequired(seasonData, validationContext);

  return errors;
}

/**
 * Hook that provides form validation for season data.
 * Validates the form data when the form values change,
 * and provides a method for manual validation.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Extra context for validation, including:
 * - level: "park", "park-area", or "feature"
 * - submitted: boolean indicating if the form has been submitted
 * - notes: internal notes text
 * @returns {Object} An object containing:
 * - {boolean} isValid Whether the form is valid (no errors)
 * - {Object} groupedErrors Errors grouped by element for display
 * - {Array} errors Array of validation error objects
 * - {Object} elements Constants for named validation error slots in the UI
 * - {Function} validateForm Function to manually validate the form and throw if errors exist
 */
export default function useValidation(seasonData, context) {
  // Re-validate when any form value changes, and update the errors array
  const errors = useMemo(
    // Call the validation function and return any errors
    () => validate(seasonData, context),
    [seasonData, context],
  );

  /**
   * Validates the form data and throws an error if there are validation errors.
   * This is used in the onSave function to ensure the form is valid before saving.
   * @param {boolean} [submitted=true] Whether the form has been submitted.
   */
  const validateForm = useCallback(
    (submitted = true) => {
      // Override `submitted` in the context, and call the validate function
      const validationContext = { ...context, submitted };

      const errorResults = validate(seasonData, validationContext);

      if (errorResults.length) {
        throw new Error(`Validation failed with ${errorResults.length} errors`);
      }
    },
    [seasonData, context],
  );

  // If there are no errors, the form is valid
  const isValid = useMemo(() => errors.length === 0, [errors]);

  // Group errors by element for display in the ValidationErrorSlot component
  const groupedErrors = useMemo(() => groupBy(errors, "element"), [errors]);

  return {
    isValid,
    groupedErrors,
    errors,
    elements,
    validateForm,
  };
}

// Create a context to provide validation errors to the UI components
export const ValidationContext = createContext(null);

// Hook for consuming validation from context in child components
export function useValidationContext() {
  const context = useContext(ValidationContext);

  if (!context) {
    throw new Error(
      "useValidationContext must be used within ValidationProvider",
    );
  }
  return context;
}
