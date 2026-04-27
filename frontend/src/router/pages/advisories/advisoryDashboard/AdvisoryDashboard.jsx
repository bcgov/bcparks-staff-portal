import { useState, useEffect, useMemo, useContext, useRef } from "react";
import {
  useLocalStorage,
  useSessionStorage,
  useDebounceCallback,
  useDebounceValue,
} from "usehooks-ts";
import qs from "qs";
import { Navigate, useNavigate } from "react-router-dom";
import ErrorContext from "@/contexts/ErrorContext";
import useCms from "@/hooks/useCms";
import "./AdvisoryDashboard.scss";
import { Button } from "@/components/advisories/shared/button/Button";
import { MultiSelect } from "@/components/advisories/shared/multiSelect/MultiSelect";
import DataTable from "@/components/advisories/composite/dataTable/DataTable";
import StatusBadge from "@/components/StatusBadge";
import FilterStatus from "@/components/advisories/shared/filterStatus/FilterStatus";
import moment from "moment";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import LightTooltip from "@/components/advisories/shared/tooltip/LightTooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faCircleQuestion,
} from "@fa-kit/icons/classic/solid";
import { updatePublicAdvisories } from "@/lib/advisories/utils/AdvisoryDataUtil";
import {
  buildFilter,
  buildSort,
} from "@/lib/advisories/utils/AdvisoryDashboardQuery";

const ALL_PAGE_SIZE = -1;
const DEFAULT_PAGE_SIZE = 50;
const TABLE_FILTER_LABELS = {
  "urgency.urgency": "Urgency",
  "advisoryStatus.advisoryStatus": "Status",
  advisoryDate: "Posting date",
  endDate: "End date",
  expiryDate: "Expiry date",
  title: "Headline",
  "eventType.eventType": "Event type",
  associatedParks: "Associated Resource(s)",
};

/**
 * Returns the value of a page-level filter from the stored filters array, or a default if not found.
 * @param {Array} storedFilters Stored filters, each with { type, filterName/fieldName, filterValue/fieldValue }
 * @param {string} filterName The name of the filter to retrieve (e.g. "region" or "park")
 * @param {any} [defaultValue=0] Default value to return if the filter isn't found in storage
 * @returns {any} The filter value, or default if not found
 */
function getPageFilterValue(storedFilters, filterName, defaultValue = 0) {
  return (
    storedFilters.find(
      (obj) => obj.type === "page" && obj.filterName === filterName,
    )?.filterValue ?? defaultValue
  );
}

function normalizePageFilterValues(filterValue) {
  if (Array.isArray(filterValue)) {
    return filterValue;
  }

  if (
    filterValue === "" ||
    filterValue === 0 ||
    filterValue === null ||
    typeof filterValue === "undefined"
  ) {
    return [];
  }

  return [filterValue];
}

export default function AdvisoryDashboard() {
  const { setError } = useContext(ErrorContext);
  const navigate = useNavigate();
  const {
    getRegions,
    getManagementAreas,
    getProtectedAreas,
    getRecreationDistricts,
    getAdvisoryStatuses,
    getUrgencies,
    cmsGet,
  } = useCms();

  const [toError, setToError] = useState(false);
  const [toCreate, setToCreate] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState([]);
  const [selectedParkId, setSelectedParkId] = useState([]);
  const [selectedPark, setSelectedPark] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [publicAdvisories, setPublicAdvisories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [managementAreas, setManagementAreas] = useState([]);
  const [protectedAreas, setProtectedAreas] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [advisoryStatuses, setAdvisoryStatuses] = useState([]);
  const [urgencies, setUrgencies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPublicAdvisories, setTotalPublicAdvisories] = useState(0);
  // Ref keeps the latest total accessible inside fetchAdvisories
  const totalPublicAdvisoriesRef = useRef(0);
  const [isCmsDataLoaded, setIsCmsDataLoaded] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);

  const defaultPageFilters = [
    { filterName: "region", filterValue: [], type: "page" },
    { filterName: "district", filterValue: [], type: "page" },
    { filterName: "park", filterValue: [], type: "page" },
  ];

  // Persisted filter state for the dashboard (region, district, park, and table filters)
  // Saved to localStorage as an array of { type: "page"|"table", filterName/fieldName, filterValue/fieldValue }
  const [storedFilters, setStoredFilters] = useLocalStorage(
    "advisoryFilters",
    defaultPageFilters,
  );
  const [initialStoredFilters] = useState(() => storedFilters || []);

  // Load table filter values from the latest storedFilters
  const initialTableFilterValues = useMemo(() => {
    const tableEntries = (storedFilters || []).filter(
      (f) => f.type === "table",
    );

    // Convert [{fieldName, fieldValue}] to { [fieldName]: fieldValue }
    return Object.fromEntries(
      tableEntries.map((f) => [f.fieldName, f.fieldValue]),
    );
  }, [storedFilters]);

  const [tableFilterValues, setTableFilterValues] = useState(
    initialTableFilterValues,
  );
  const activeTableFilters = useMemo(
    () =>
      Object.entries(tableFilterValues || {})
        .filter(([, value]) => value !== "" && value !== null)
        .map(([field, value]) => ({
          field,
          label: `${TABLE_FILTER_LABELS[field] || field}: ${value}`,
        })),
    [tableFilterValues],
  );
  // Debounced copy used as the fetchAdvisories dependency
  // Prevents Strapi request on every keystroke while keeping filter inputs responsive
  const [debouncedTableFilterValues] = useDebounceValue(tableFilterValues, 300);

  // Debounced callback: persist table filter values to localStorage
  // Called by DataTable after user stops typing
  const persistTableFilterValues = useDebounceCallback((values) => {
    setStoredFilters((currentFilters) => {
      // Keep page-level filters (region, district, park)
      const pageFilters = currentFilters.filter((f) => f.type === "page");
      // Convert { [fieldName]: value } to array of { fieldName, fieldValue, type: "table" }
      const tableFilters = Object.entries(values)
        // Only save non-empty filters
        .filter(([, value]) => value !== "")
        .map(([fieldName, fieldValue]) => ({
          fieldName,
          fieldValue,
          type: "table",
        }));

      return [...pageFilters, ...tableFilters];
    });
  }, 75);

  // Persist showArchived in sessionStorage
  const [showArchived, setShowArchived] = useSessionStorage(
    "showArchived",
    false,
  );

  function renderCountBadge(label) {
    return (
      <Badge pill bg="light" text="dark" className="park-count-badge">
        {label}
      </Badge>
    );
  }

  // Load management areas, advisory statuses, urgencies, and published advisories once on mount.
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardContext() {
      try {
        const [
          regionsData,
          managementAreasData,
          protectedAreasData,
          districtsData,
          fetchedAdvisoryStatuses,
          fetchedUrgencies,
        ] = await Promise.all([
          getRegions(),
          getManagementAreas(),
          getProtectedAreas(),
          getRecreationDistricts(),
          getAdvisoryStatuses(),
          getUrgencies(),
        ]);

        if (!isMounted) return;

        setRegions(regionsData);
        setManagementAreas(managementAreasData);
        setProtectedAreas(protectedAreasData);
        setDistricts(districtsData);

        // Fetch advisory statuses and urgencies for filter options and table icons
        setAdvisoryStatuses(fetchedAdvisoryStatuses);
        setUrgencies(fetchedUrgencies);

        if (isMounted) {
          // Preserve filters
          const regionIds = normalizePageFilterValues(
            getPageFilterValue(initialStoredFilters, "region", []),
          );

          if (regionIds.length > 0) {
            const selectedRegions = regionsData
              .filter((region) => regionIds.includes(region.documentId))
              .map((region) => ({
                label: `${region.regionName} Region`,
                value: region.documentId,
              }));

            if (selectedRegions.length > 0) {
              setSelectedRegionId(regionIds);
              setSelectedRegion(selectedRegions);
            }
          }

          const districtIds = normalizePageFilterValues(
            getPageFilterValue(initialStoredFilters, "district", []),
          );

          if (districtIds.length > 0) {
            const selectedDistricts = districtsData
              .filter((district) => districtIds.includes(district.documentId))
              .map((district) => ({
                label: district.district,
                value: district.documentId,
              }));

            if (selectedDistricts.length > 0) {
              setSelectedDistrictId(districtIds);
              setSelectedDistrict(selectedDistricts);
            }
          }

          const parkIds = normalizePageFilterValues(
            getPageFilterValue(initialStoredFilters, "park", []),
          );

          if (parkIds.length > 0) {
            const selectedParks = protectedAreasData
              .filter((park) => parkIds.includes(park.documentId))
              .map((park) => ({
                label: park.protectedAreaName,
                value: park.documentId,
              }));

            if (selectedParks.length > 0) {
              setSelectedParkId(parkIds);
              setSelectedPark(selectedParks);
            }
          }
          setIsCmsDataLoaded(true);
        }
      } catch (error) {
        console.error("Error loading dashboard context:", error);
        setHasErrors(true);
        setError({ status: 500, message: "Error loading data." });
      }
    }

    loadDashboardContext();

    return () => {
      isMounted = false;
    };
  }, [
    cmsGet,
    getAdvisoryStatuses,
    getManagementAreas,
    getProtectedAreas,
    getRecreationDistricts,
    getRegions,
    getUrgencies,
    initialStoredFilters,
    setError,
  ]);

  // Fetch one page of advisories whenever page, pageSize, or showArchived changes.
  useEffect(() => {
    let isMounted = true;

    async function fetchAdvisories() {
      setIsLoading(true);
      setPublicAdvisories([]);

      try {
        const standardCutoffDate = moment()
          .subtract(30, "days")
          .format("YYYY-MM-DD");
        const extendedCutoffDate = moment()
          .subtract(18, "months")
          .format("YYYY-MM-DD");

        const advisoryFilter = showArchived
          ? {
              $or: [
                { advisoryStatus: { code: { $ne: "UNP" } } },
                { updatedAt: { $gt: extendedCutoffDate } },
              ],
            }
          : {
              $or: [
                { advisoryStatus: { code: { $ne: "UNP" } } },
                { updatedAt: { $gt: standardCutoffDate } },
              ],
            };

        // Build server-side filter params from column filter values and region/park dropdowns
        const columnFilterClauses = buildFilter(
          debouncedTableFilterValues,
          selectedRegionId,
          selectedDistrictId,
          selectedParkId,
        );

        // When "All" is selected, first fetch the current total with
        // the active filters applied, then request exactly that many rows
        let pagination;

        if (pageSize < 0) {
          const countQuery = qs.stringify(
            {
              fields: ["id"],
              filters: {
                $and: [
                  { isLatestRevision: true },
                  advisoryFilter,
                  ...columnFilterClauses,
                ],
              },
              pagination: { page: 1, pageSize: 1 },
            },
            { encodeValuesOnly: true },
          );
          const countResult = await cmsGet(
            `/public-advisory-audits?${countQuery}`,
            {},
            "",
          );
          const allTotal =
            countResult.meta?.pagination?.total ?? DEFAULT_PAGE_SIZE;

          pagination = { page: 1, pageSize: Math.max(allTotal, 1) };
        } else {
          pagination = { page: currentPage, pageSize };
        }

        const sort = buildSort(sortConfig);

        const query = qs.stringify(
          {
            fields: [
              "advisoryNumber",
              "advisoryDate",
              "title",
              "effectiveDate",
              "expiryDate",
              "updatedAt",
            ],
            populate: {
              protectedAreas: { fields: ["orcs", "protectedAreaName"] },
              recreationResources: {
                fields: ["recResourceId", "resourceName"],
              },
              advisoryStatus: { fields: ["advisoryStatus", "code"] },
              eventType: { fields: ["eventType"] },
              urgency: { fields: ["urgency"] },
              regions: { fields: ["regionName"] },
              recreationDistricts: { fields: ["district"] },
            },
            filters: {
              $and: [
                { isLatestRevision: true },
                advisoryFilter,
                ...columnFilterClauses,
              ],
            },
            pagination,
            sort,
          },
          { encodeValuesOnly: true },
        );

        const result = await cmsGet(`/public-advisory-audits?${query}`, {}, "");
        const rows = result.data ?? [];
        const total = result.meta?.pagination?.total ?? 0;
        const updatedPublicAdvisories = updatePublicAdvisories(
          rows,
          managementAreas,
        );

        if (isMounted) {
          setPublicAdvisories(updatedPublicAdvisories);
          totalPublicAdvisoriesRef.current = total;
          setTotalPublicAdvisories(total);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching advisories:", error);
        setError({
          status: 500,
          message: "Error loading data. Make sure Strapi is running.",
        });
        setToError(true);
        setIsLoading(false);
      }
    }

    if (isCmsDataLoaded) {
      fetchAdvisories();
    }

    return () => {
      isMounted = false;
    };
  }, [
    cmsGet,
    currentPage,
    isCmsDataLoaded,
    managementAreas,
    pageSize,
    selectedDistrictId,
    selectedParkId,
    selectedRegionId,
    setError,
    showArchived,
    sortConfig,
    debouncedTableFilterValues,
  ]);

  const regionOptions = useMemo(
    () =>
      (regions || []).map((region) => ({
        label: `${region.regionName} Region`,
        value: region.documentId,
      })),
    [regions],
  );

  const districtOptions = useMemo(
    () =>
      (districts || []).map((district) => ({
        label: district.district,
        value: district.documentId,
      })),
    [districts],
  );

  const parkOptions = useMemo(
    () =>
      (protectedAreas || []).map((park) => ({
        label: park.protectedAreaName,
        value: park.documentId,
      })),
    [protectedAreas],
  );

  const tableColumns = useMemo(
    () => [
      {
        field: "urgency.urgency",
        title: (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="advisory-urgency-tooltip">Urgency</Tooltip>}
          >
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="warningRoundedIcon"
            />
          </OverlayTrigger>
        ),
        filterOnItemSelect: true,
        lookup: urgencies.reduce((lookup, urgency) => {
          lookup[urgency.urgency] = urgency.urgency;
          return lookup;
        }, {}),
        headerStyle: {
          width: 10,
        },
        cellStyle(e, rowData) {
          const baseStyle = {
            position: "relative",
          };

          if (rowData.urgency !== null) {
            switch (rowData.urgency?.urgency?.toLowerCase()) {
              case "low":
                return {
                  ...baseStyle,
                  borderLeft: "8px solid #053662",
                };
              case "medium":
                return {
                  ...baseStyle,
                  borderLeft: "8px solid #F8BB47",
                };
              case "high":
                return {
                  ...baseStyle,
                  borderLeft: "8px solid #CE3E39",
                };
              default:
                return baseStyle;
            }
          }

          return baseStyle;
        },
        render(rowData) {
          return (
            <OverlayTrigger
              placement="left"
              overlay={
                <Tooltip id={`urgency-${rowData.documentId || rowData.id}`}>
                  {rowData.urgency
                    ? rowData.urgency.urgency
                    : "Urgency not set"}
                </Tooltip>
              }
            >
              <div className="urgency-column">&nbsp;</div>
            </OverlayTrigger>
          );
        },
      },
      {
        field: "advisoryStatus.advisoryStatus",
        title: "Status",
        filterOnItemSelect: true,
        lookup: advisoryStatuses.reduce((lookup, status) => {
          lookup[status.advisoryStatus] = status.advisoryStatus;
          return lookup;
        }, {}),
        cellStyle: {
          textAlign: "left",
        },
        render(rowData) {
          const statusClassMap = {
            DFT: "status-draft",
            UNP: "status-unpublished",
            HQR: "status-hq-review",
            SCH: "status-scheduled",
            PUB: "status-published",
            ARCHIVED: "status-archived",
          };

          const statusText = rowData.archived
            ? "Archived"
            : rowData.advisoryStatus?.advisoryStatus;

          const statusCode = rowData.archived
            ? "ARCHIVED"
            : rowData.advisoryStatus?.code;

          const badgeClassName = statusClassMap[statusCode];

          return (
            <StatusBadge
              status={statusCode}
              label={statusText}
              className={`advisory-status-badge ${badgeClassName}`}
            />
          );
        },
      },
      {
        field: "associatedResources",
        title: "Associated Resource(s)",
        headerStyle: { width: 400 },
        cellStyle: { width: 400 },
        render(rowData) {
          const displayCount = 3;
          const regionsCount = rowData.regions?.length;

          if (regionsCount > 0) {
            const displayedRegions = rowData?.regions?.slice(0, displayCount);

            return (
              <div>
                {displayedRegions?.map((p, i) => (
                  <span key={i}>
                    {p.regionName} region
                    {renderCountBadge(`${p.count} parks`)}
                  </span>
                ))}
                {regionsCount > displayCount && (
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip
                        id={`regions-more-${rowData.documentId || rowData.id}`}
                      >
                        {`plus ${regionsCount - displayCount} more region(s)`}
                      </Tooltip>
                    }
                  >
                    <span>
                      {renderCountBadge(`+${regionsCount - displayCount}`)}
                    </span>
                  </OverlayTrigger>
                )}
              </div>
            );
          }

          // park advisories
          const parksCount = rowData.protectedAreas.length;
          const displayedProtectedAreas = rowData.protectedAreas.slice(
            0,
            displayCount,
          );

          if (parksCount > 0) {
            return (
              <div>
                {displayedProtectedAreas.map((p, i) => (
                  <span key={i}>
                    {p.protectedAreaName}
                    {displayedProtectedAreas.length - 1 > i && ", "}
                  </span>
                ))}
                {parksCount > displayCount && (
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip
                        id={`parks-more-${rowData.documentId || rowData.id}`}
                      >
                        {`plus ${parksCount - displayCount} more park(s)`}
                      </Tooltip>
                    }
                  >
                    <span>
                      {renderCountBadge(`+${parksCount - displayCount}`)}
                    </span>
                  </OverlayTrigger>
                )}
              </div>
            );
          }

          // RST closures
          const resourcesCount = rowData.recreationResources.length;
          const displayedResources = rowData.recreationResources.slice(
            0,
            displayCount,
          );

          return (
            <div>
              {displayedResources.map((r, i) => (
                <span key={i}>
                  {r.resourceName} {`(${r.recResourceId})`}
                  {displayedResources.length - 1 > i && ", "}
                </span>
              ))}
              {resourcesCount > displayCount && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip
                      id={`resources-more-${rowData.documentId || rowData.id}`}
                    >
                      {`plus ${resourcesCount - displayCount} more resource(s)`}
                    </Tooltip>
                  }
                >
                  <span>
                    {renderCountBadge(`+${resourcesCount - displayCount}`)}
                  </span>
                </OverlayTrigger>
              )}
            </div>
          );
        },
      },
      { field: "eventType.eventType", title: "Event type" },
      {
        field: "title",
        title: "Headline",
        headerStyle: { width: 400 },
        cellStyle: { width: 400 },
        render(rowData) {
          return (
            <div dangerouslySetInnerHTML={{ __html: rowData.title }}></div>
          );
        },
      },
      {
        field: "advisoryDate",
        title: "Posting date",
        render(rowData) {
          if (rowData.advisoryDate) {
            return moment(rowData.advisoryDate).format("YYYY/MM/DD");
          }

          return null;
        },
      },
      {
        field: "expiryDate",
        title: "Expiry date",
        render(rowData) {
          if (rowData.expiryDate) {
            return moment(rowData.expiryDate).format("YYYY/MM/DD");
          }

          return null;
        },
      },
      {
        title: "",
        field: "id",
        filtering: false,
        headerStyle: {
          width: 30,
          maxWidth: 30,
          minWidth: 30,
        },
        cellStyle: {
          width: 30,
          maxWidth: 30,
          minWidth: 30,
          textAlign: "left",
        },
        render: () => (
          <button
            type="button"
            className="table-row-action"
            aria-label="row actions"
          >
            ...
          </button>
        ),
      },
    ],
    [urgencies, advisoryStatuses],
  );

  if (toCreate) {
    return <Navigate to="/create-advisory" />;
  }
  if (toError || hasErrors) {
    return <Navigate to="/error" />;
  }

  return (
    <div className="advisory-dashboard-page-wrap advisories-styles">
      <div className="container-fluid">
        <div className="row ad-row">
          <div className="col-12">
            <h1 className="title">Advisories and closures</h1>
          </div>
        </div>
        <div className="row ad-row">
          <div className="col-12 text-end">
            <Button
              label="+ Create advisory / closure"
              styling="bcgov-normal-blue btn"
              onClick={() => {
                setToCreate(true);
              }}
            />
          </div>
        </div>
        <div className="row ad-row">
          <div className="col-xl-3 col-md-6 col-sm-12">
            <MultiSelect
              label="RST Recreation district"
              countLabel="RST Recreation district"
              placeholder="Search or select a district"
              value={selectedDistrict}
              options={districtOptions}
              onChange={(e) => {
                const selectedDistricts = e || [];
                const selectedDistrictIds = selectedDistricts.map(
                  (district) => district.value,
                );

                setSelectedDistrict(selectedDistricts);
                setSelectedDistrictId(selectedDistrictIds);
                setCurrentPage(1);

                setStoredFilters((currentFilters) => {
                  const nonDistrictPageFilters = currentFilters.filter(
                    (o) => !(o.type === "page" && o.filterName === "district"),
                  );

                  return [
                    ...nonDistrictPageFilters,
                    {
                      type: "page",
                      filterName: "district",
                      filterValue: selectedDistrictIds,
                    },
                  ];
                });
              }}
            />
          </div>
          <div className="col-xl-3 col-md-6 col-sm-12">
            <MultiSelect
              label="BC Parks region"
              countLabel="BC Parks region"
              placeholder="Search or select a region"
              value={selectedRegion}
              options={regionOptions}
              onChange={(e) => {
                const selectedRegions = e || [];
                const selectedRegionIds = selectedRegions.map(
                  (region) => region.value,
                );

                setSelectedRegion(selectedRegions);
                setSelectedRegionId(selectedRegionIds);
                setCurrentPage(1);

                setStoredFilters((currentFilters) => {
                  const nonRegionPageFilters = currentFilters.filter(
                    (o) => !(o.type === "page" && o.filterName === "region"),
                  );

                  return [
                    ...nonRegionPageFilters,
                    {
                      type: "page",
                      filterName: "region",
                      filterValue: selectedRegionIds,
                    },
                  ];
                });
              }}
            />
          </div>
          <div className="col-xl-3 col-md-6 col-sm-12">
            <MultiSelect
              label="BC Parks park"
              countLabel="BC Parks park"
              placeholder="Search or select a park"
              value={selectedPark}
              options={parkOptions}
              onChange={(e) => {
                const selectedParks = e || [];
                const selectedParkIds = selectedParks.map((park) => park.value);

                setSelectedPark(selectedParks);
                setSelectedParkId(selectedParkIds);
                setCurrentPage(1);

                setStoredFilters((currentFilters) => {
                  const nonParkPageFilters = currentFilters.filter(
                    (o) => !(o.type === "page" && o.filterName === "park"),
                  );

                  return [
                    ...nonParkPageFilters,
                    {
                      type: "page",
                      filterName: "park",
                      filterValue: selectedParkIds,
                    },
                  ];
                });
              }}
            />
          </div>
        </div>
        <div className="row ad-row">
          <div className="col-12">
            <Form.Check
              className="advisory-archived-toggle mt-3"
              type="checkbox"
              id="show-archived"
              checked={showArchived}
              onChange={(e) => {
                setShowArchived(e.target.checked);
                setCurrentPage(1);
              }}
              label={
                <span>
                  Show advisories and closures that have not been updated in 30
                  days
                  <LightTooltip
                    arrow
                    title="By default, inactive advisories that have not been modified in the past 30 days are hidden. Check this
                   box to include inactive advisories modified in the past 18 months. Older advisories are available in Strapi."
                  >
                    <FontAwesomeIcon
                      icon={faCircleQuestion}
                      className="helpIcon ms-1"
                    />
                  </LightTooltip>
                </span>
              }
            />
          </div>
          <FilterStatus
            totalResults={totalPublicAdvisories}
            selectedRegion={selectedRegion}
            onClearRegion={() => {
              setSelectedRegion(null);
              setSelectedRegionId(0);
              setSelectedPark(null);
              setSelectedParkId(0);
              setCurrentPage(1);
              setStoredFilters((currentFilters) => {
                const nonPageFilters = currentFilters.filter(
                  (currentFilter) => currentFilter.type !== "page",
                );

                return [
                  ...nonPageFilters,
                  {
                    type: "page",
                    filterName: "region",
                    filterValue: 0,
                  },
                  {
                    type: "page",
                    filterName: "park",
                    filterValue: 0,
                  },
                ];
              });
            }}
            selectedPark={selectedPark}
            onClearPark={() => {
              setSelectedPark(null);
              setSelectedParkId(0);
              setCurrentPage(1);
              setStoredFilters((currentFilters) => {
                const nonParkPageFilters = currentFilters.filter(
                  (currentFilter) =>
                    !(
                      currentFilter.type === "page" &&
                      currentFilter.filterName === "park"
                    ),
                );

                return [
                  ...nonParkPageFilters,
                  {
                    type: "page",
                    filterName: "park",
                    filterValue: 0,
                  },
                ];
              });
            }}
            selectedTableFilters={activeTableFilters}
            onClearTableFilter={(field) => {
              setTableFilterValues((prev) => ({ ...prev, [field]: "" }));
              setCurrentPage(1);
              setStoredFilters((currentFilters) =>
                currentFilters.filter(
                  (currentFilter) =>
                    !(
                      currentFilter.type === "table" &&
                      currentFilter.fieldName === field
                    ),
                ),
              );
            }}
            showArchived={showArchived}
            onClearShowArchived={() => {
              setShowArchived(false);
              setCurrentPage(1);
            }}
            hasAnyFilters={
              Boolean(selectedRegion) ||
              Boolean(selectedPark) ||
              showArchived ||
              activeTableFilters.length > 0
            }
            onClearAll={() => {
              setSelectedRegion(null);
              setSelectedRegionId(0);
              setSelectedPark(null);
              setSelectedParkId(0);
              setShowArchived(false);
              setTableFilterValues({});
              setCurrentPage(1);
              setStoredFilters(defaultPageFilters);
            }}
          />
        </div>
      </div>
      {
        <div className="advisory-dashboard" data-testid="AdvisoryDashboard">
          <br />
          <div className="container-fluid">
            <DataTable
              filtering
              search={false}
              pageSize={pageSize}
              pageSizeOptions={[25, 50, ALL_PAGE_SIZE]}
              serverSide
              totalItems={totalPublicAdvisories}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setCurrentPage(1);
              }}
              onFilterChange={({ field, value }) => {
                setTableFilterValues((prev) => ({ ...prev, [field]: value }));
                setCurrentPage(1);
              }}
              onSortChange={(next) => {
                setSortConfig(next);
                setCurrentPage(1);
              }}
              initialFilterValues={initialTableFilterValues}
              filterValues={tableFilterValues}
              onFilterValuesChange={persistTableFilterValues}
              columns={tableColumns}
              data={publicAdvisories}
              title=""
              onRowClick={(event, rowData) => {
                navigate(`/advisory-summary/${rowData.documentId}`);
              }}
              components={{
                Toolbar: () => <div></div>,
              }}
            />
          </div>
        </div>
      }
      {isLoading && (
        <div className="page-loader">
          <Loader page />
        </div>
      )}
    </div>
  );
}
