import PropTypes from "prop-types";
import FilterBadge from "@/components/shared/FilterBadge";

import "@/components/FilterStatus.scss";

export default function FilterStatus({
  totalResults,
  selectedRegion,
  onClearRegion,
  selectedPark,
  onClearPark,
  selectedTableFilters,
  onClearTableFilter,
  showArchived,
  onClearShowArchived,
  hasAnyFilters,
  onClearAll,
}) {
  return (
    <div className="filter-status mt-3">
      {hasAnyFilters && (
        <div className="num-results mb-2">
          {totalResults} result{totalResults === 1 ? "" : "s"}
        </div>
      )}

      <div className="active-filters d-flex flex-row flex-wrap gap-2 align-items-center">
        {selectedRegion && (
          <FilterBadge
            label={`BC Parks region: ${selectedRegion.label}`}
            onRemove={onClearRegion}
          />
        )}

        {selectedPark && (
          <FilterBadge
            label={`BC Parks park: ${selectedPark.label}`}
            onRemove={onClearPark}
          />
        )}

        {selectedTableFilters.map((filter) => (
          <FilterBadge
            key={filter.field}
            label={filter.label}
            onRemove={() => onClearTableFilter(filter.field)}
          />
        ))}

        {showArchived && (
          <FilterBadge label="Show archived" onRemove={onClearShowArchived} />
        )}

        {hasAnyFilters && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClearAll}
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}

FilterStatus.propTypes = {
  totalResults: PropTypes.number.isRequired,
  selectedRegion: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onClearRegion: PropTypes.func.isRequired,
  selectedPark: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onClearPark: PropTypes.func.isRequired,
  selectedTableFilters: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onClearTableFilter: PropTypes.func.isRequired,
  showArchived: PropTypes.bool.isRequired,
  onClearShowArchived: PropTypes.func.isRequired,
  hasAnyFilters: PropTypes.bool.isRequired,
  onClearAll: PropTypes.func.isRequired,
};

FilterStatus.defaultProps = {
  selectedRegion: null,
  selectedPark: null,
  selectedTableFilters: [],
};
