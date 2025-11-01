import { createContext, useContext, useCallback, useMemo } from "react";
import { groupBy } from "lodash-es";
import validGateTime from "./rules/validGateTime.js";
import hasGateChosen from "./rules/hasGateChosen.js";
import requiredDateRanges from "./rules/requiredDateRanges.js";
import startDateBeforeEndDate from "./rules/startDateBeforeEndDate.js";
import dateInOperatingYear from "./rules/dateInOperatingYear.js";
import noOverlapPrevious from "./rules/noOverlapPrevious.js";
import noteCharacterLimit from "./rules/noteCharacterLimit.js";
import changeNoteRequired from "./rules/changeNoteRequired.js";
import reservationWithinOperating from "./rules/reservationWithinOperating.js";
import reservationEndsBeforeOperatingEnds from "./rules/reservationEndsBeforeOperatingEnds.js";
import completeDateRanges from "./rules/completeDateRanges.js";
import tier1And2SameAsReservation from "./rules/tier1And2SameAsReservation.js";
import tier1And2NoOverlap from "./rules/tier1And2NoOverlap.js";
import reservationSameAsTier1And2 from "./rules/reservationSameAsTier1And2.js";
import winterAndReservationNoOverlap from "./rules/winterAndReservationNoOverlap.js";
import winterDateYears from "./rules/winterDateYears.js";
import reservationAndWinterNoOverlap from "./rules/reservationAndWinterNoOverlap.js";

// Constants for named "validation error slots" in the UI
const elements = {
  // Under the "Has gate? Yes/No" radio buttons
  HAS_GATE: "hasGate",

  // Under the gate hours time range inputs
  GATE_TIMES: "gateTimes",

  // Under the "internal notes" textarea
  INTERNAL_NOTES: "internalNotes",

  // Under an individual date range by its ID
  dateRange: (idOrTempId) => `dateRange-${idOrTempId}`,

  // Under an individual date input field by its dateRange ID and its field name
  dateField: (idOrTempId, fieldName) => `dateField-${idOrTempId}-${fieldName}`,

  // Under all the date ranges for a dateable feature, by date type
  dateableDateType: (dateableId, dateTypeName) =>
    `dateableDateType-${dateableId}-${dateTypeName}`,

  // Under a form section for a dateable entity, such as a Feature, by its dateableId
  dateableSection: (dateableId) => `formSection-${dateableId}`,
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

  // Provide the flat array of Feature Reservation dates in the context, for Park-level validation
  validationContext.featureReservationDates =
    seasonData.featureReservationDates ?? [];

  // Provide flat arrays of some Park-level dates in the context, for Feature/Area Reservation validation
  validationContext.parkTier1Dates = seasonData.parkTier1Dates ?? [];
  validationContext.parkTier2Dates = seasonData.parkTier2Dates ?? [];
  validationContext.parkWinterDates = seasonData.parkWinterDates ?? [];

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
  completeDateRanges(seasonData, validationContext);
  requiredDateRanges(seasonData, validationContext);
  startDateBeforeEndDate(seasonData, validationContext);
  dateInOperatingYear(seasonData, validationContext);
  noOverlapPrevious(seasonData, validationContext);
  noteCharacterLimit(seasonData, validationContext);
  changeNoteRequired(seasonData, validationContext);
  reservationWithinOperating(seasonData, validationContext);
  reservationEndsBeforeOperatingEnds(seasonData, validationContext);
  tier1And2SameAsReservation(seasonData, validationContext);
  tier1And2NoOverlap(seasonData, validationContext);
  reservationSameAsTier1And2(seasonData, validationContext);
  winterAndReservationNoOverlap(seasonData, validationContext);
  winterDateYears(seasonData, validationContext);
  reservationAndWinterNoOverlap(seasonData, validationContext);

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
 * - {Function} validateForm Function to manually validate the form and return any errors found
 */
export default function useValidation(seasonData, context) {
  // Re-validate when any form value changes, and update the errors array
  const errors = useMemo(
    // Call the validation function and return any errors
    () => validate(seasonData, context),
    [seasonData, context],
  );

  /**
   * Validates the form data and returns any validation errors.
   * This is used in the saveForm function to ensure the form is valid before saving.
   * @param {boolean} [submitted=true] Whether the form has been submitted.
   * @returns {Array} Array of validation error objects
   */
  const validateForm = useCallback(
    (submitted = true) => {
      // Override `submitted` in the context, and call the validate function
      const validationContext = { ...context, submitted };

      const errorResults = validate(seasonData, validationContext);

      // Return the errors. Any length > 0 means the form is invalid.
      return errorResults;
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
