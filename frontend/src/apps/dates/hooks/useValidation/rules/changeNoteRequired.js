/**
 * Validates that a change note is provided when editing approved or published seasons.
 * If the season status is approved or published, internal notes are required.
 * @param {Object} seasonData The season form data to validate
 * @param {Object} context Validation context with errors array
 * @returns {void}
 */
export default function changeNoteRequired(seasonData, context) {
  const { current } = seasonData;
  const { elements, notes, onlyReadyToPublishChanged } = context;

  // Only applies to approved or published seasons
  if (current.status !== "approved" && current.status !== "published") return;

  // Toggling "Ready to publish" by itself doesn't change any dates, so no note is needed
  if (onlyReadyToPublishChanged) return;

  if (!notes.trim()) {
    context.addError(
      // Show error below the notes input
      elements.INTERNAL_NOTES,
      "The dates you are editing have already been approved or published. Please provide a note explaining the reason for this update.",
    );
  }
}
