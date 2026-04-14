/**
 * Converts a date string from display format (YYYY/MM/DD) to ISO format (YYYY-MM-DD)
 * @param {string} value Date string in display format
 * @returns {string} Date string with slashes replaced by dashes
 */
function toIsoDateFilter(value) {
  return value.replace(/\//gu, "-");
}

/**
 * Maps a DataTable column field to the Strapi $and filter builder.
 */
const COLUMN_FILTERS = [
  {
    key: "urgency.urgency",
    build: (value) => ({ urgency: { urgency: { $eq: value } } }),
  },
  {
    key: "advisoryStatus.advisoryStatus",
    build: (value) => ({ advisoryStatus: { advisoryStatus: { $eq: value } } }),
  },
  {
    key: "advisoryDate",
    build: (value) => ({ advisoryDate: { $containsi: toIsoDateFilter(value) } }),
  },
  {
    key: "endDate",
    build: (value) => ({ endDate: { $containsi: toIsoDateFilter(value) } }),
  },
  {
    key: "expiryDate",
    build: (value) => ({ expiryDate: { $containsi: toIsoDateFilter(value) } }),
  },
  {
    key: "title",
    build: (value) => ({ title: { $containsi: value } }),
  },
  {
    key: "eventType.eventType",
    build: (value) => ({ eventType: { eventType: { $containsi: value } } }),
  },
  {
    key: "associatedParks",
    build: (value) => ({
      protectedAreas: { protectedAreaName: { $containsi: value } },
    }),
  },
];

/**
 * Builds an array of filters
 * @param {Object} tableFilterValues Column filter values keyed by column field name
 * @param {number} selectedRegionId Selected region id (0 = none)
 * @param {string|number} selectedParkId Selected park documentId (0 = none)
 * @param {Array} protectedAreas Full list of protected areas (used to resolve orcs from documentId)
 * @returns {Array} Array of Strapi filters
 */
export function buildFilter(
  tableFilterValues,
  selectedRegionId,
  selectedParkId,
  protectedAreas,
) {
  const filters = [];

  for (const { key, build } of COLUMN_FILTERS) {
    if (tableFilterValues[key]) {
      filters.push(build(tableFilterValues[key]));
    }
  }

  if (selectedRegionId) {
    filters.push({
      regions: { id: { $eq: selectedRegionId } },
    });
  }

  if (selectedParkId && selectedParkId !== -1) {
    const park = protectedAreas.find(
      (protectedArea) => protectedArea.documentId === selectedParkId,
    );

    if (park) {
      filters.push({
        protectedAreas: { orcs: { $eq: park.orcs } },
      });
    }
  }

  return filters;
}

/**
 * Maps a DataTable column field to the Strapi sort field.
 * Some columns display a name string but should sort by a numeric sequence field.
 */
const SORT_FIELD_MAP = {
  "urgency.urgency": "urgency.sequence",
};

/**
 * Builds an array of sorts
 * @param {{ field: string, direction: "asc"|"desc" } | null} sortConfig Current sort state (null = default)
 * @returns {string[]} Array of Strapi sorts
 */
export function buildSort(sortConfig) {
  if (sortConfig) {
    const field = SORT_FIELD_MAP[sortConfig.field] ?? sortConfig.field;

    return [`${field}:${sortConfig.direction.toUpperCase()}`];
  }

  return ["advisoryDate:DESC"];
}
