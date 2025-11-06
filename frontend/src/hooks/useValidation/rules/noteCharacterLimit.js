/**
 * Validates that internal notes do not exceed the maximum character limit.
 * Adds a validation error if the notes text exceeds 2000 characters.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function noteCharacterLimit(seasonData, context) {
  const { notes, addError, elements } = context;

  if (notes && notes.length > 2000) {
    addError(
      elements.INTERNAL_NOTES,
      "Notes cannot exceed 2000 characters"
    );
  }
}
