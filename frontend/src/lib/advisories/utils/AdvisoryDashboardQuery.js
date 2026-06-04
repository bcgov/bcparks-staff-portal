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
    key: "accessStatus.accessStatus",
    build: (value) => ({
      $or: [
        { accessStatus: { accessStatus: { $containsi: value } } },
        { accessStatus: { groupLabel: { $containsi: value } } },
      ],
    }),
  },
  {
    key: "advisoryDate",
    build: (value) => ({
      advisoryDate: { $containsi: toIsoDateFilter(value) },
    }),
  },
  {
    key: "modifiedDate",
    build: (value) => ({
      modifiedDate: { $containsi: toIsoDateFilter(value) },
    }),
  },
  {
    key: "endDate",
    build: (value) => ({
      endDate: { $containsi: toIsoDateFilter(value) },
    }),
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
    key: "associatedResources",
    build: (value) => ({
      $or: [
        { protectedAreas: { protectedAreaName: { $containsi: value } } },
        { recreationResources: { resourceName: { $containsi: value } } },
        { recreationResources: { recResourceId: { $containsi: value } } },
      ],
    }),
  },
];

/**
 * Builds an array of filters
 * @param {Object} tableFilterValues Column filter values keyed by column field name
 * @param {string[]} selectedRegionIds Selected region documentIds ([] = none)
 * @param {string[]} selectedDistrictIds Selected district documentIds ([] = none)
 * @param {string[]} selectedParkIds Selected park documentIds ([] = none)
 * @param {string} selectedProgramArea Selected program area code ("" = none, "BCP" or "RST")
 * @returns {Array} Array of Strapi filters
 */
export function buildFilter(
  tableFilterValues,
  selectedRegionIds,
  selectedDistrictIds,
  selectedParkIds,
  selectedProgramArea = "",
) {
  const filters = [];

  for (const { key, build } of COLUMN_FILTERS) {
    if (tableFilterValues[key]) {
      filters.push(build(tableFilterValues[key]));
    }
  }

  if (selectedRegionIds.length > 0) {
    filters.push({
      $or: [
        { regions: { documentId: { $in: selectedRegionIds } } },
        {
          protectedAreas: {
            managementAreas: {
              region: { documentId: { $in: selectedRegionIds } },
            },
          },
        },
      ],
    });
  }

  if (selectedDistrictIds.length > 0) {
    filters.push({
      recreationResources: {
        recreationDistrict: { documentId: { $in: selectedDistrictIds } },
      },
    });
  }

  if (selectedParkIds.length > 0) {
    filters.push({
      protectedAreas: { documentId: { $in: selectedParkIds } },
    });
  }

  if (selectedProgramArea === "BCP") {
    filters.push({
      protectedAreas: { $notNull: true },
    });
  } else if (selectedProgramArea === "RST") {
    filters.push({
      recreationResources: { $notNull: true },
    });
  }

  return filters;
}

/**
 * Maps a DataTable column field to Strapi sort fields.
 * Some columns display a name string but should sort by a numeric sequence field.
 * Array values send multiple sort keys (useful when a column can hold different relation types).
 */
const SORT_FIELD_MAP = {
  "urgency.urgency": "urgency.sequence",
  "advisoryStatus.advisoryStatus": "advisoryStatus.sortOrder",
  "accessStatus.accessStatus": "accessStatus.precedence",
  associatedResources: [
    "recreationResources.resourceName",
    "protectedAreas.protectedAreaName",
    "regions.regionName",
    "sections.sectionName",
    "managementAreas.managementAreaName",
  ],
};

/**
 * Builds an array of sorts
 * @param {{ field: string, direction: "asc"|"desc" } | null} sortConfig Current sort state (null = default)
 * @param {boolean} isReviewDashboard Whether this is for the review dashboard, which has a different default sort
 * @returns {string[]} Array of Strapi sorts
 */
export function buildSort(sortConfig, isReviewDashboard = false) {
  if (sortConfig) {
    const mapped = SORT_FIELD_MAP[sortConfig.field] ?? sortConfig.field;
    const fields = Array.isArray(mapped) ? mapped : [mapped];
    const direction = sortConfig.direction.toUpperCase();

    return fields.map((field) => `${field}:${direction}`);
  }

  if (isReviewDashboard) {
    return ["modifiedDate:ASC"];
  }

  return ["advisoryDate:DESC"];
}
