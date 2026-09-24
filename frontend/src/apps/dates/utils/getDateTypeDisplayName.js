/**
 * Returns the display label for a date type name.
 * @param {string} dateTypeName The date type name from the API
 * @returns {string} The display label for the date type
 */
export default function getDateTypeDisplayName(dateTypeName) {
  if (dateTypeName === "Operation") return "Facility available";

  return dateTypeName;
}
