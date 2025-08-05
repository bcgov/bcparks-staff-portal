/**
 * Validates that the "hasGate" question is answered.
 * Can be "Yes" or "No" (true/false) but it can't be left null.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function hasGateChosen(seasonData, context) {
  const { current } = seasonData;
  const { elements } = context;

  // Only validate after the form is submitted
  if (!context.submitted) return;

  // hasGate radio buttons are initially null, but Yes or No is required
  if (current.gateDetail === null) {
    context.addError(elements.HAS_GATE, "Select an option");
  }
}
