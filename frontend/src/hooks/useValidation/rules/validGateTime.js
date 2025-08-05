/**
 * Validates that the gate times are set correctly.
 * If gate times are provided, both open and close times must be set.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function validGateTime(seasonData, context) {
  const { current } = seasonData;
  const { elements } = context;
  const gateDetail = current.gateDetail;

  // Only validate after the form is submitted
  if (!context.submitted) return;

  // gateDetail.hasGate must be true to validate gate times
  if (!gateDetail?.hasGate) return;

  const openTimeSet = gateDetail.gateOpensAtDawn || gateDetail.gateOpenTime;
  const closeTimeSet = gateDetail.gateClosesAtDusk || gateDetail.gateCloseTime;

  // Date times are optional, but if one field is set, the other must be set too
  if (closeTimeSet && !openTimeSet) {
    context.addError(elements.GATE_TIMES, "Enter a start time");
  }

  if (openTimeSet && !closeTimeSet) {
    context.addError(elements.GATE_TIMES, "Enter an end time");
  }
}
