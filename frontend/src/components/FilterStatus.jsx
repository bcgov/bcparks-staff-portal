import { useMemo } from "react";
import { reject, without } from "lodash-es";
import Badge from "react-bootstrap/Badge";
import CloseButton from "react-bootstrap/CloseButton";

function FilterBadge({ label, onRemove }) {
  // @TODO: use stylesheet instead of inline styles
  return (
    <div
      data-bs-theme="dark"
      className="filter-badge fs-5 d-flex align-items-center"
      style={{ minHeight: "36px" }}
    >
      <Badge pill bg="primary" className="px-2 py-1 d-flex align-items-center">
        <span>{label}</span>

        <CloseButton
          className="ms-2"
          style={{ fontSize: "0.75rem" }}
          onClick={onRemove}
        />
      </Badge>
    </div>
  );
}

export default function FilterStatus({
  activeFiltersProp,
  filteredCount,
  ClearFilters,
}) {
  let activeFilters = {
    name: "parkfoo",

    accessGroups: [
      {
        id: 26,
        name: "Babine Lake",
      },
      {
        id: 34,
        name: "Bijoux/Heather/Pine Le Moray/Heart Lake",
      },
      {
        id: 42,
        name: "Buckinghorse River Wayside",
      },
      {
        id: 6,
        name: "Bugaboo and Kokanee Glacier Park",
      },
    ],

    status: ["requested", "approved"],

    sections: [
      {
        id: 2,
        sectionNumber: 6,
        name: "Kootenay",
      },
      {
        id: 4,
        sectionNumber: 3,
        name: "Omineca",
      },
    ],

    managementAreas: [
      {
        id: 22,
        managementAreaNumber: 3,
        name: "Atlin/Tatshenshini",
      },
      {
        id: 15,
        managementAreaNumber: 7,
        name: "Cape Scott",
      },
    ],

    dateTypes: [
      {
        id: 77,
        strapiDateTypeId: 2,
        name: "Tier 1",
      },
      { id: 79, name: "Winter fee", strapiDateTypeId: 4 },
      { id: 80, name: "Winter fee", strapiDateTypeId: 4 },
    ],

    featureTypes: [
      {
        id: 304,
        name: "Backcountry",
      },
      {
        id: 319,
        name: "Day-use",
      },
      {
        id: 306,
        name: "Day-use area",
      },
    ],

    isInReservationSystem: true,
    hasDateNote: true,
  };

  function removeFilter(removeFn) {
    const newFilters = removeFn(activeFilters);

    console.log("Updated Filters:", newFilters);

    activeFilters = newFilters; // @TODO: emit this to the parent
  }

  const filterTags = useMemo(() => {
    const tags = [];

    // Park name filter (text input box)
    if (activeFilters.name) {
      tags.push({
        label: `Name: ${activeFilters.name}`,

        remove(filters) {
          filters.name = "";
          return filters;
        },
      });
    }

    // Access Groups (bundles) filter (multi-select)
    if (activeFilters.accessGroups.length) {
      const bundleTags = activeFilters.accessGroups.map((bundle) => ({
        label: `Access Group: ${bundle.name}`, // @TODO: use constants for display name

        remove(filters) {
          filters.accessGroups = reject(filters.accessGroups, [
            "id",
            bundle.id,
          ]);

          return filters;
        },
      }));

      tags.push(...bundleTags);
    }

    // Status filter (multi-select)
    if (activeFilters.status.length) {
      const statusTags = activeFilters.status.map((status) => ({
        label: `Status: ${status}`,

        remove(filters) {
          filters.status = without(filters.status, status);
          return filters;
        },
      }));

      tags.push(...statusTags);
    }

    // Sections filter (multi-select)
    if (activeFilters.sections.length) {
      const sectionTags = activeFilters.sections.map((section) => ({
        label: `Section: ${section.name}`,

        remove(filters) {
          filters.sections = reject(filters.sections, ["id", section.id]);
          return filters;
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
            filters.managementAreas = reject(filters.managementAreas, [
              "id",
              mgmtArea.id,
            ]);
            return filters;
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
          filters.dateTypes = reject(filters.dateTypes, ["id", dateType.id]);
          return filters;
        },
      }));

      tags.push(...dateTypeTags);
    }

    // Feature Types filter (multi-select)
    if (activeFilters.featureTypes.length) {
      const featureTypeTags = activeFilters.featureTypes.map((featureType) => ({
        label: `Feature Type: ${featureType.name}`,

        remove(filters) {
          filters.featureTypes = reject(filters.featureTypes, [
            "id",
            featureType.id,
          ]);
          return filters;
        },
      }));

      tags.push(...featureTypeTags);
    }

    // In Reservation System filter (boolean)
    if (activeFilters.isInReservationSystem) {
      tags.push({
        label: `In Reservation System`,

        remove(filters) {
          filters.isInReservationSystem = false;
          return filters;
        },
      });
    }

    // Has Date Note filter (boolean)
    if (activeFilters.hasDateNote) {
      tags.push({
        label: `Has Date Note`,

        remove(filters) {
          filters.hasDateNote = false;
          return filters;
        },
      });
    }

    return tags;
  }, [activeFilters]);

  return (
    <div className="filter-status">
      <div className="num-results mb-3">{filteredCount} results</div>

      <div className="active-filters mb-3 d-flex flex-row flex-wrap gap-2 align-items-center">
        {filterTags.map((tag, index) => (
          <FilterBadge
            key={index}
            label={tag.label}
            onRemove={() => removeFilter(tag.remove)}
          />
        ))}

        <ClearFilters />
      </div>
    </div>
  );
}
