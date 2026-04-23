import PropTypes from "prop-types";
import FilterBadge from "@/components/shared/FilterBadge";

import "@/components/FilterStatus.scss";

export default function FilterStatus({
  totalResults,
  selectedRegion,
  onClearRegion,
  selectedPark,
  onClearPark,
  hasAnyFilters,
  onClearAll,
}) {
  return (
    <div className="filter-status mt-3">
      {totalResults > 0 && (
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
  hasAnyFilters: PropTypes.bool.isRequired,
  onClearAll: PropTypes.func.isRequired,
};

FilterStatus.defaultProps = {
  selectedRegion: null,
  selectedPark: null,
};
