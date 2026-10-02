import * as STATUS from "@/constants/seasonStatus";

/**
 * Builds an ordered list of the forms that can be opened from the Submit page table,
 * in the same order as the "Edit" buttons are rendered in SubmitPageTable.
 * Used to find the "next" form when continuing to the next form after submitting.
 * @param {Array<Object>} tableData Filtered park data, formatted for the Submit page table
 * @param {Array<Object>} sortOrder Park area type / feature type grouping order (from getTableSortOrder)
 * @returns {Array<{seasonId: number, level: string, status: string, parkId: number}>} Ordered list of editable forms
 */
export default function getEditableFormList(tableData = [], sortOrder = []) {
  // The table doesn't render any rows until the sort order is loaded
  if (!sortOrder?.length) return [];

  const forms = [];

  function addForm(park, season, level) {
    // Skip rows without a season to edit
    if (!season?.id) return;

    forms.push({
      seasonId: season.id,
      level,
      status: season.status,
      parkId: park.id,
    });
  }

  for (const park of tableData) {
    // Park-level seasons are only shown if the park isn't filtered out
    if (park.matchesFilters !== false) {
      if (park.showTiersAndGate) {
        addForm(park, park.currentSeason?.regular, "park");
      }

      if (park.showWinterFee) {
        addForm(park, park.currentSeason?.winter, "park");
      }
    }

    const parkAreas = park.parkAreas || [];
    const features = park.features || [];

    for (const groupingType of sortOrder) {
      if (groupingType.type === "ParkAreaType") {
        parkAreas
          .filter(
            (parkArea) =>
              parkArea.parkAreaType?.parkAreaTypeNumber ===
              groupingType.parkAreaTypeNumber,
          )
          .forEach((parkArea) =>
            addForm(park, parkArea.currentSeason?.regular, "park-area"),
          );
      }

      if (groupingType.type === "FeatureType") {
        features
          .filter(
            (feature) =>
              feature.featureType?.featureTypeNumber ===
              groupingType.featureTypeNumber,
          )
          .forEach((feature) =>
            addForm(park, feature.currentSeason?.regular, "feature"),
          );
      }
    }
  }

  return forms;
}

/**
 * Finds the next form after the current one that still needs to be submitted or approved.
 * Approved and published seasons are skipped.
 * @param {Array<{seasonId: number, level: string, status: string}>|null} formList Ordered list from getEditableFormList
 * @param {number} seasonId Season ID of the form currently open (unique across all levels)
 * @returns {{seasonId: number, level: string, status: string}|null} The next form, or null if there isn't one
 */
export function findNextForm(formList, seasonId) {
  if (!formList) return null;

  const currentIndex = formList.findIndex((form) => form.seasonId === seasonId);

  // If the current form isn't in the table (e.g. filtered out), there's no "next" form
  if (currentIndex === -1) return null;

  // Search forward from the current form
  const remainingForms = formList.slice(currentIndex + 1);

  return (
    remainingForms.find(
      (form) =>
        form.status !== STATUS.APPROVED.value &&
        form.status !== STATUS.PUBLISHED.value,
    ) ?? null
  );
}
