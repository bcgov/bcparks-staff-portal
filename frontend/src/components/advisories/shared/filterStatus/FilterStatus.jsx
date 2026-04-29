import PropTypes from "prop-types";
import FilterBadge from "@/components/shared/FilterBadge";

import "@/components/FilterStatus.scss";

function normalizeSelections(selection) {
  if (!selection) {
    return [];
  }

  if (Array.isArray(selection)) {
    return selection.filter((item) => item?.label && item?.value);
  }

  if (selection.label && selection.value) {
    return [selection];
  }

  return [];
}

export default function FilterStatus({
  totalResults,
  selectedDistrict,
  onClearDistrict,
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
  const selectedDistricts = normalizeSelections(selectedDistrict);
  const selectedRegions = normalizeSelections(selectedRegion);
  const selectedParks = normalizeSelections(selectedPark);

  return (
    <div className="filter-status mt-3">
      {hasAnyFilters && (
        <div className="num-results mb-2">
          {totalResults} result{totalResults === 1 ? "" : "s"}
        </div>
      )}

      <div className="active-filters d-flex flex-row flex-wrap gap-2 align-items-center">
        {selectedDistricts.map((district) => (
          <FilterBadge
            key={`district-${district.value}`}
            label={`RST Recreation district: ${district.label}`}
            onRemove={() => onClearDistrict(district.value)}
          />
        ))}

        {selectedRegions.map((region) => (
          <FilterBadge
            key={`region-${region.value}`}
            label={`BC Parks region: ${region.label}`}
            onRemove={() => onClearRegion(region.value)}
          />
        ))}

        {selectedParks.map((park) => (
          <FilterBadge
            key={`park-${park.value}`}
            label={`BC Parks park: ${park.label}`}
            onRemove={() => onClearPark(park.value)}
          />
        ))}

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
  selectedDistrict: PropTypes.oneOfType([
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
  ]),
  onClearDistrict: PropTypes.func.isRequired,
  selectedRegion: PropTypes.oneOfType([
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
  ]),
  onClearRegion: PropTypes.func.isRequired,
  selectedPark: PropTypes.oneOfType([
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
  ]),
  onClearPark: PropTypes.func.isRequired,
  selectedTableFilters: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  onClearTableFilter: PropTypes.func.isRequired,
  showArchived: PropTypes.bool.isRequired,
  onClearShowArchived: PropTypes.func.isRequired,
  hasAnyFilters: PropTypes.bool.isRequired,
  onClearAll: PropTypes.func.isRequired,
};

FilterStatus.defaultProps = {
  selectedDistrict: [],
  selectedRegion: [],
  selectedPark: [],
  selectedTableFilters: [],
};
