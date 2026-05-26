export const DATE_SORT_FIELDS = new Set([
  "advisoryDate",
  "modifiedDate",
  "endDate",
  "expiryDate",
]);

/**
 * Sort advisories by a date field while always placing empty dates last
 * @param {Array<Object>} rows Advisory rows to sort
 * @param {string} field Date field name on each advisory row
 * @param {"asc"|"desc"} direction Sort direction
 * @returns {Array<Object>} A new sorted array with null dates appended at the end
 */
export function sortByDateFieldNullsLast(rows, field, direction) {
  const advisoriesWithDate = [];
  const advisoriesWithoutDate = [];

  for (const advisory of rows) {
    const rawDate = advisory[field];
    const parsedDate = Date.parse(rawDate);

    if (!Number.isNaN(parsedDate)) {
      advisoriesWithDate.push({
        advisory,
        timestamp: parsedDate,
      });
    } else {
      advisoriesWithoutDate.push(advisory);
    }
  }

  advisoriesWithDate.sort((left, right) => {
    if (direction === "desc") {
      return right.timestamp - left.timestamp;
    }

    return left.timestamp - right.timestamp;
  });

  return [
    ...advisoriesWithDate.map((entry) => entry.advisory),
    ...advisoriesWithoutDate,
  ];
}

/**
 * Sort advisories by associatedResources while keeping empty values at the bottom.
 * @param {Array<Object>} rows Advisory rows to sort.
 * @param {"asc"|"desc"} direction Sort direction.
 * @returns {Array<Object>} A new sorted array.
 */
export function sortByAssociatedResources(rows, direction) {
  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  return [...rows].sort((left, right) => {
    const leftValue = normalize(left.associatedResources);
    const rightValue = normalize(right.associatedResources);

    // Keep empty values at the bottom in both directions.
    if (!leftValue && !rightValue) {
      return 0;
    }

    if (!leftValue) {
      return 1;
    }

    if (!rightValue) {
      return -1;
    }

    const result = leftValue.localeCompare(rightValue);

    return direction === "desc" ? -result : result;
  });
}