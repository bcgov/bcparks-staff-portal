/**
 * Returns true when the input is a non-empty array.
 * @param {Array} items Candidate collection.
 * @returns {boolean} Whether at least one item is selected.
 */
export function hasSelectedItems(items) {
  return Array.isArray(items) && items.length > 0;
}

/**
 * Filters options by BCP/RST scope based on currently selected resource types.
 * @param {Array<{scope: string}>} options Option list that may include a scope field.
 * @param {boolean} hasBcpResourcesSelected Whether BCP resources are selected.
 * @param {boolean} hasRstResourcesSelected Whether RST resources are selected.
 * @returns {Array<{scope: string}>} Filtered options matching the active scope context.
 */
export function filterOptionsByScope(
  options,
  hasBcpResourcesSelected,
  hasRstResourcesSelected,
) {
  if (hasBcpResourcesSelected && hasRstResourcesSelected) {
    return options.filter((option) => option.scope === "Both");
  }

  if (hasBcpResourcesSelected) {
    return options.filter((option) => {
      const scope = option.scope;

      return scope === "BCP" || scope === "Both";
    });
  }

  if (hasRstResourcesSelected) {
    return options.filter((option) => {
      const scope = option.scope;

      return scope === "RST" || scope === "Both";
    });
  }

  return options;
}

/**
 * Formats a select label by prefixing the category when it differs from the label.
 * @param {Object} option Select option object.
 * @param {string} [categoryKey="category"] Property name used to read the category.
 * @returns {string} Display label for selected values.
 */
export function formatCategoryLabel(option, categoryKey = "category") {
  const label = option?.label || "";
  const category = option?.[categoryKey] || "";
  const shouldShowLabelOnly = !category || category === label;

  if (shouldShowLabelOnly) {
    return label;
  }

  return `${category} - ${label}`;
}
