import { useMemo } from "react";
import { reject, without } from "lodash-es";
import Badge from "react-bootstrap/Badge";
import CloseButton from "react-bootstrap/CloseButton";
import PropTypes from "prop-types";
import { labelByValue } from "@/constants/seasonStatus";

import "./FilterStatus.scss";

function FilterBadge({ label, onRemove }) {
  return (
    <div
      data-bs-theme="dark"
      className="filter-badge fs-5 d-flex align-items-center"
    >
      <Badge
        pill
        bg="primary"
        className="px-2 py-1 d-flex align-items-center fw-normal"
      >
        <span>{label}</span>

        <CloseButton className="ms-2" onClick={onRemove} />
      </Badge>
    </div>
  );
}

FilterBadge.propTypes = {
  label: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default function FilterStatus({
  activeFilters,
  filteredCount,
  ClearFilters,
  updateFilter,
}) {
  const filterTags = useMemo(() => {
    // Filter tags data: objects with `label` and a `remove` function
    const tags = [];

    // Park name filter (text input box)
    if (activeFilters.name) {
      tags.push({
        label: `Name: ${activeFilters.name}`,

        remove() {
          updateFilter("name", "");
        },
      });
    }

    // Access Groups (bundles) filter (multi-select)
    if (activeFilters.accessGroups.length) {
      const bundleTags = activeFilters.accessGroups.map((bundle) => ({
        label: `Access Group: ${bundle.name}`,

        remove(filters) {
          updateFilter(
            "accessGroups",
            reject(filters.accessGroups, ["id", bundle.id]),
          );
        },
      }));

      tags.push(...bundleTags);
    }

    // Status filter (multi-select)
    if (activeFilters.status.length) {
      const statusTags = activeFilters.status.map((status) => ({
        label: `Status: ${labelByValue[status]}`,

        remove(filters) {
          updateFilter("status", without(filters.status, status));
        },
      }));

      tags.push(...statusTags);
    }

    // Sections filter (multi-select)
    if (activeFilters.sections.length) {
      const sectionTags = activeFilters.sections.map((section) => ({
        label: `Section: ${section.name}`,

        remove(filters) {
          updateFilter(
            "sections",
            reject(filters.sections, ["id", section.id]),
          );
        },
      }));

      tags.push(...sectionTags);
    }

    // Management Areas filter (multi-select)
    if (activeFilters.managementAreas.length) {
      const managementAreaTags = activeFilters.managementAreas.map(
        (mgmtArea) => ({
          label: `Management Area: ${mgmtArea.name}`,

          remove(filters) {
            updateFilter(
              "managementAreas",
              reject(filters.managementAreas, ["id", mgmtArea.id]),
            );
          },
        }),
      );

      tags.push(...managementAreaTags);
    }

    // Date Types filter (multi-select)
    if (activeFilters.dateTypes.length) {
      const dateTypeTags = activeFilters.dateTypes.map((dateType) => ({
        label: `Date Type: ${dateType.name}`,

        remove(filters) {
          updateFilter(
            "dateTypes",
            reject(filters.dateTypes, ["id", dateType.id]),
          );
        },
      }));

      tags.push(...dateTypeTags);
    }

    // Feature Types filter (multi-select)
    if (activeFilters.featureTypes.length) {
      const featureTypeTags = activeFilters.featureTypes.map((featureType) => ({
        label: `Feature Type: ${featureType.name}`,

        remove(filters) {
          updateFilter(
            "featureTypes",
            reject(filters.featureTypes, ["id", featureType.id]),
          );
        },
      }));

      tags.push(...featureTypeTags);
    }

    // In Reservation System filter (boolean)
    if (activeFilters.isInReservationSystem) {
      tags.push({
        label: `In Reservation System`,

        remove() {
          updateFilter("isInReservationSystem", false);
        },
      });
    }

    // Has Date Note filter (boolean)
    if (activeFilters.hasDateNote) {
      tags.push({
        label: `Has Date Note`,

        remove() {
          updateFilter("hasDateNote", false);
        },
      });
    }

    return tags;
  }, [activeFilters, updateFilter]);

  // Don't render the component if there are no active filters
  if (filterTags.length === 0) {
    return null;
  }

  // If filters are active, show the "filter tags" and the reset button
  return (
    <div className="filter-status">
      <div className="num-results mb-3">
        {filteredCount} result{filteredCount === 1 ? "" : "s"}
      </div>

      <div className="active-filters mb-3 d-flex flex-row flex-wrap gap-2 align-items-center">
        {filterTags.map((tag, index) => (
          <FilterBadge
            key={tag.label}
            label={tag.label}
            onRemove={() => tag.remove(activeFilters)}
          />
        ))}

        <ClearFilters />
      </div>
    </div>
  );
}

FilterStatus.propTypes = {
  activeFilters: PropTypes.shape({
    name: PropTypes.string,
    accessGroups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
    status: PropTypes.arrayOf(PropTypes.string),
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
    managementAreas: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
    dateTypes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
    featureTypes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
    isInReservationSystem: PropTypes.bool,
    hasDateNote: PropTypes.bool,
  }).isRequired,
  filteredCount: PropTypes.number.isRequired,
  ClearFilters: PropTypes.elementType.isRequired,
  updateFilter: PropTypes.func.isRequired,
};
