import {
  useState,
  useEffect,
  useMemo,
  useContext,
  useRef,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import {
  useLocalStorage,
  useSessionStorage,
  useDebounceCallback,
  useDebounceValue,
} from "usehooks-ts";
import qs from "qs";
import { Link, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import ErrorContext from "@/contexts/ErrorContext";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import useAccess from "@/hooks/useAccess";
import useCms from "@/hooks/useCms";
import "./AdvisoryDashboard.scss";
import emptyReviewQueueImage from "@/router/pages/advisories/advisoryDashboard/empty-review-queue.png";
import { Button } from "@/components/advisories/shared/button/Button";
import { MultiSelect } from "@/components/advisories/shared/multiSelect/MultiSelect";
import { TableActionButton } from "@/components/advisories/shared/tableActionButton/TableActionButton";
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
  faPlus,
} from "@fa-kit/icons/classic/solid";
import { updatePublicAdvisories } from "@/lib/advisories/utils/AdvisoryDataUtil";
import {
  buildFilter,
  buildSort,
} from "@/lib/advisories/utils/AdvisoryDashboardQuery";
import useAdvisoryUnpublish from "@/hooks/advisories/useAdvisoryUnpublish";
import { TABLE_FILTER_LABELS } from "@/constants/advisoryDashboardFilter";
import buildReviewFilter from "@/lib/advisories/utils/AdvisoryReviewDashboardQuery";
import {
  clearAllFilters as clearAllFiltersHandler,
  clearDistrictFilter as clearDistrictFilterHandler,
  clearParkFilter as clearParkFilterHandler,
  clearRegionFilter as clearRegionFilterHandler,
  clearShowArchivedFilter as clearShowArchivedFilterHandler,
  clearTableFilter as clearTableFilterHandler,
  getPageFilterValue,
  handlePageMultiSelectChange as handlePageMultiSelectChangeHandler,
  normalizePageFilterValues,
  updateRegionAndParkFilters as updateRegionAndParkFiltersHandler,
} from "./advisoryDashboardFilterHandlers";

const ALL_PAGE_SIZE = -1;
const DEFAULT_PAGE_SIZE = 50;

// Component to render when there are no advisories/closures to review in the Review tab
function ReviewEmptyState() {
  return (
    <div className="review-empty-state">
      <img
        src={emptyReviewQueueImage}
        alt="No items waiting for review"
        width="335"
        height="500"
        className="empty-state-image mb-3"
      />

      <h2 className="mb-2">You’re doing great!</h2>

      <div>
        I’m obsessed with you.
        <br />
        No items to review here.
      </div>
    </div>
  );
}

export default function AdvisoryDashboard({
  filterStorageKey = "advisoryFilters",
  isReviewDashboard = false,
}) {
  const { setError } = useContext(ErrorContext);
  const globalFlashMessage = useContext(FlashMessageContext);
  const auth = useAuth();
  const { hasAnyRole } = useAccess();
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
  // Track the total number of items regardless of filters when we need to know if the filters are hiding items on the server
  const [unfilteredTotalItems, setUnfilteredTotalItems] = useState(null);
  // Ref keeps the latest total accessible inside fetchAdvisories
  const totalPublicAdvisoriesRef = useRef(0);
  const [isCmsDataLoaded, setIsCmsDataLoaded] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Flash message functions for unpublish actions
  const openUnpublishError = useCallback(
    (message) => {
      globalFlashMessage.open(
        "Failed to unpublish Advisory / Closure",
        message,
        {
          variant: "error",
        },
      );
    },
    [globalFlashMessage],
  );

  const openUnpublishSuccess = useCallback(
    (message) => {
      globalFlashMessage.open("Unpublished Advisory / Closure", message, {
        variant: "success",
      });
    },
    [globalFlashMessage],
  );

  const handleUnpublish = useAdvisoryUnpublish({
    advisoryStatuses,
    modifiedBy: auth.user?.profile?.name,
    isApprover: hasAnyRole(["approver"]),
    openUnpublishError,
    openUnpublishSuccess,
    onSuccess() {
      // Refresh the advisory dashboard to reflect the unpublished change
      setRefreshKey((current) => current + 1);
    },
  });

  const defaultPageFilters = [
    { filterName: "region", filterValue: [], type: "page" },
    { filterName: "district", filterValue: [], type: "page" },
    { filterName: "park", filterValue: [], type: "page" },
  ];

  // Persisted filter state for the dashboard (region, district, park, and table filters)
  // Saved to localStorage as an array of { type: "page"|"table", filterName/fieldName, filterValue/fieldValue }
  const [storedFilters, setStoredFilters] = useLocalStorage(
    filterStorageKey,
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
  // Active table filters for rendering filter badges and building Strapi queries
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
  // Use separate keys for All vs Review tabs so each maintains independent state
  const showArchivedStorageKey = isReviewDashboard
    ? "showArchivedReview"
    : "showArchived";
  const [showArchived, setShowArchived] = useSessionStorage(
    showArchivedStorageKey,
    false,
  );

  function renderCountBadge(label, documentId, title) {
    return (
      <Link
        to={`/advisory-summary/${documentId}`}
        aria-label={`Open advisory summary for ${title}`}
      >
        <Badge pill bg="light" text="dark" className="park-count-badge">
          {label}
        </Badge>
      </Link>
    );
  }

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  function updateRegionAndParkFilters(regionFilterValue, parkFilterValue) {
    updateRegionAndParkFiltersHandler({
      setStoredFilters,
      regionFilterValue,
      parkFilterValue,
    });
  }

  function handlePageMultiSelectChange(
    selectedOptions,
    filterName,
    setSelectedOptions,
    setSelectedIds,
  ) {
    handlePageMultiSelectChangeHandler({
      selectedOptions,
      filterName,
      setSelectedOptions,
      setSelectedIds,
      resetToFirstPage,
      setStoredFilters,
    });
  }

  function handleDistrictChange(selectedOptions) {
    handlePageMultiSelectChange(
      selectedOptions,
      "district",
      setSelectedDistrict,
      setSelectedDistrictId,
    );
  }

  function handleRegionChange(selectedOptions) {
    handlePageMultiSelectChange(
      selectedOptions,
      "region",
      setSelectedRegion,
      setSelectedRegionId,
    );
  }

  function handleParkChange(selectedOptions) {
    handlePageMultiSelectChange(
      selectedOptions,
      "park",
      setSelectedPark,
      setSelectedParkId,
    );
  }

  function clearDistrictFilter(districtValue) {
    clearDistrictFilterHandler({
      districtValue,
      selectedDistrict,
      setSelectedDistrict,
      setSelectedDistrictId,
      resetToFirstPage,
      setStoredFilters,
    });
  }

  function clearRegionFilter(regionValue) {
    clearRegionFilterHandler({
      regionValue,
      selectedRegion,
      setSelectedRegion,
      setSelectedRegionId,
      setSelectedPark,
      setSelectedParkId,
      resetToFirstPage,
      setStoredFilters,
      updateRegionAndParkFiltersFn: updateRegionAndParkFilters,
    });
  }

  function clearParkFilter(parkValue) {
    clearParkFilterHandler({
      parkValue,
      selectedPark,
      setSelectedPark,
      setSelectedParkId,
      resetToFirstPage,
      setStoredFilters,
    });
  }

  function clearTableFilter(field) {
    clearTableFilterHandler({
      field,
      setTableFilterValues,
      resetToFirstPage,
      setStoredFilters,
    });
  }

  function clearShowArchivedFilter() {
    clearShowArchivedFilterHandler({
      setShowArchived,
      resetToFirstPage,
    });
  }

  function clearAllFilters() {
    clearAllFiltersHandler({
      setSelectedDistrict,
      setSelectedDistrictId,
      setSelectedRegion,
      setSelectedRegionId,
      setSelectedPark,
      setSelectedParkId,
      setShowArchived,
      setTableFilterValues,
      resetToFirstPage,
      setStoredFilters,
      defaultPageFilters,
    });
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
        const unpublishedCutoffDate = moment()
          .subtract(30, "days")
          .format("YYYY-MM-DD");

        // Build server-side filter params from column filter values and region/park dropdowns
        const userFilterClauses = buildFilter(
          debouncedTableFilterValues,
          selectedRegionId,
          selectedDistrictId,
          selectedParkId,
        );

        const reviewFilterClauses = buildReviewFilter({ isReviewDashboard });

        // Filters applied to server queries, regardless of user-selected filters
        const sharedBaseFilters = [{ isLatestRevision: true }];

        // When not showing archived advisories, filter out unpublished advisories older than 30 days
        if (!showArchived) {
          sharedBaseFilters.push({
            $or: [
              // Always include all non-unpublished advisories
              { advisoryStatus: { code: { $ne: "UNP" } } },
              {
                $and: [
                  { advisoryStatus: { code: { $eq: "UNP" } } },
                  { updatedAt: { $gt: unpublishedCutoffDate } },
                ],
              },
            ],
          });
        }

        // Build filter sets for fetching data with and without user-selected filters
        const filteredBaseFilters = [
          ...sharedBaseFilters,
          ...userFilterClauses,
          ...reviewFilterClauses,
        ];
        const unfilteredBaseFilters = [
          ...sharedBaseFilters,
          ...reviewFilterClauses,
        ];

        // When "All" is selected, first fetch the current total with
        // the active filters applied, then request exactly that many rows
        let pagination;
        let allTotal = null;

        if (pageSize < 0) {
          const countQuery = qs.stringify(
            {
              fields: ["id"],
              filters: {
                $and: filteredBaseFilters,
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

          allTotal = countResult.meta?.pagination?.total ?? DEFAULT_PAGE_SIZE;

          pagination = { page: 1, pageSize: Math.max(allTotal, 1) };
        } else {
          pagination = { page: currentPage, pageSize };
        }

        const sort = buildSort(sortConfig, isReviewDashboard);

        const query = qs.stringify(
          {
            fields: [
              "advisoryNumber",
              "advisoryDate",
              "title",
              "effectiveDate",
              "endDate",
              "expiryDate",
              "updatedDate",
              "updatedAt",
              "reviewedAt",
            ],
            populate: {
              protectedAreas: { fields: ["orcs", "protectedAreaName"] },
              recreationResources: {
                fields: ["recResourceId", "resourceName"],
              },
              accessStatus: { fields: ["accessStatus", "groupLabel"] },
              advisoryStatus: { fields: ["advisoryStatus", "code"] },
              eventType: { fields: ["eventType"] },
              urgency: { fields: ["urgency"] },
              regions: { fields: ["regionName"] },
              recreationDistricts: { fields: ["district"] },
            },
            filters: {
              $and: filteredBaseFilters,
            },
            pagination,
            sort,
          },
          { encodeValuesOnly: true },
        );

        const result = await cmsGet(`/public-advisory-audits?${query}`, {}, "");
        const rows = result.data ?? [];
        const total = allTotal ?? result.meta?.pagination?.total ?? 0;
        const updatedPublicAdvisories = updatePublicAdvisories(
          rows,
          managementAreas,
        );

        // Run an additional query without user-selected filters when we need
        // to tell if the empty state is server-side or caused by user-selected filters.
        // Only applies to the Review dashboard when user-selected filters are active
        // and the main query returns zero results.
        if (isReviewDashboard && userFilterClauses.length && total === 0) {
          const unfilteredCountQuery = qs.stringify(
            {
              fields: ["id"],
              filters: {
                $and: unfilteredBaseFilters,
              },
              pagination: { page: 1, pageSize: 1 },
            },
            { encodeValuesOnly: true },
          );

          const unfilteredCountResult = await cmsGet(
            `/public-advisory-audits?${unfilteredCountQuery}`,
            {},
            "",
          );

          if (isMounted) {
            // Store the unfiltered total so we can know if the server-side review queue is empty.
            setUnfilteredTotalItems(
              unfilteredCountResult.meta?.pagination?.total ?? 0,
            );
          }
        } else if (isMounted) {
          setUnfilteredTotalItems(null);
        }

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
    isReviewDashboard,
    debouncedTableFilterValues,
    refreshKey,
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
              className="warning-icon"
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
        title: (
          <>
            Advisory /
            <br />
            Closure status
          </>
        ),
        filterOnItemSelect: true,
        lookup: advisoryStatuses.reduce((lookup, status) => {
          lookup[status.advisoryStatus] = status.advisoryStatus;
          return lookup;
        }, {}),
        cellStyle: {
          textAlign: "left",
        },
        render(rowData) {
          const statusCode = rowData.archived
            ? "ARCHIVED"
            : rowData.advisoryStatus?.code;

          return (
            <StatusBadge
              status={statusCode}
              className={"advisory-status-badge"}
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
                    {renderCountBadge(
                      `+${p.count}`,
                      rowData.documentId,
                      rowData.title,
                    )}
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
                      {renderCountBadge(
                        `+${regionsCount - displayCount}`,
                        rowData.documentId,
                        rowData.title,
                      )}
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
                      {renderCountBadge(
                        `+${parksCount - displayCount}`,
                        rowData.documentId,
                        rowData.title,
                      )}
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
                    {renderCountBadge(
                      `+${resourcesCount - displayCount}`,
                      rowData.documentId,
                      rowData.title,
                    )}
                  </span>
                </OverlayTrigger>
              )}
            </div>
          );
        },
      },
      {
        field: "accessStatus.accessStatus",
        title: (
          <>
            Resource
            <br />
            status
          </>
        ),
        headerStyle: { minWidth: 120 },
        cellStyle: { minWidth: 120 },
        render(rowData) {
          const accessStatus = rowData.accessStatus?.accessStatus || "";
          const groupLabel = rowData.accessStatus?.groupLabel || "";

          if (!accessStatus) return "";

          return groupLabel && groupLabel !== accessStatus
            ? `${groupLabel} - ${accessStatus}`
            : accessStatus;
        },
      },
      { field: "eventType.eventType", title: "Event type" },
      {
        field: "title",
        title: "Headline",
        headerStyle: { width: 250 },
        cellStyle: { width: 250 },
        render(rowData) {
          return (
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id={`headline-tooltip-${rowData.documentId}`}>
                  {rowData.title}
                </Tooltip>
              }
            >
              <Link
                to={`/advisory-summary/${rowData.documentId}`}
                className="advisory-headline-link"
                aria-label={rowData.title}
              >
                {rowData.title}
              </Link>
            </OverlayTrigger>
          );
        },
      },
      ...(isReviewDashboard
        ? [
            {
              field: "modifiedDate",
              title: "Last updated",
              render(rowData) {
                if (rowData.modifiedDate) {
                  return moment(rowData.modifiedDate).format("YYYY/MM/DD");
                }

                return null;
              },
            },
          ]
        : []),
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
      ...(isReviewDashboard
        ? [
            {
              field: "endDate",
              title: "End date",
              render(rowData) {
                if (rowData.endDate) {
                  return moment(rowData.endDate).format("YYYY/MM/DD");
                }

                return null;
              },
            },
          ]
        : []),
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
        sorting: false,
        render: (rowData) => (
          <TableActionButton
            className="ms-1 me-3"
            rowId={rowData.documentId}
            canUnpublish={["SCH", "PUB"].includes(rowData.advisoryStatus?.code)}
            onView={() => navigate(`/advisory-summary/${rowData.documentId}`)}
            onEdit={() => navigate(`/update-advisory/${rowData.documentId}`)}
            onUnpublish={() => handleUnpublish(rowData)}
          />
        ),
      },
    ],
    [urgencies, advisoryStatuses, navigate, handleUnpublish, isReviewDashboard],
  );

  if (toCreate) {
    return <Navigate to="/create-advisory" />;
  }
  if (toError || hasErrors) {
    return <Navigate to="/error" />;
  }

  // Use the unfiltered comparison total when available; otherwise fall back
  // to the currently displayed query total
  const comparisonTotalItems = unfilteredTotalItems ?? totalPublicAdvisories;

  // Show the review-specific empty state when there are no items to review on the server,
  // regardless of client-side filters.
  const showNoItemsToReviewMessage =
    isReviewDashboard && !isLoading && comparisonTotalItems === 0;

  const emptyState = showNoItemsToReviewMessage ? (
    <ReviewEmptyState />
  ) : (
    <div>No records to display.</div>
  );

  return (
    <div className="advisory-dashboard-page-wrap advisories-styles layout landing-page-tabs">
      <header className="section-tabs d-flex flex-column">
        <div className="container">
          <h1 className="title m-3 mb-4">Advisories and closures</h1>
          <ul className="nav nav-tabs px-2">
            <li className="nav-item">
              <NavLink className="nav-link" to="/advisories-and-closures" end>
                All
              </NavLink>
            </li>
            {hasAnyRole(["approver"]) && (
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/advisories-and-closures/review"
                >
                  Review
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </header>

      <div className="container-fluid">
        <div className="row">
          <div
            className={classNames(
              "col-12 order-xl-0 order-1 d-flex flex-wrap",
              {
                "col-xl-9": !isReviewDashboard,
              },
            )}
          >
            <div className="row filter-row ">
              <div className="filter-col col-md-6 col-12">
                <MultiSelect
                  label="RST recreation district"
                  countLabel="RST recreation district"
                  placeholder="Search or select a district"
                  value={selectedDistrict}
                  options={districtOptions}
                  onChange={handleDistrictChange}
                />
              </div>
              <div className="filter-col col-md-6 col-12">
                <MultiSelect
                  label="BC Parks region"
                  countLabel="BC Parks region"
                  placeholder="Search or select a region"
                  value={selectedRegion}
                  options={regionOptions}
                  onChange={handleRegionChange}
                />
              </div>
              <div className="filter-col col-md-6 col-12">
                <MultiSelect
                  label="BC Parks park"
                  countLabel="BC Parks park"
                  placeholder="Search or select a park"
                  value={selectedPark}
                  options={parkOptions}
                  onChange={handleParkChange}
                />
              </div>
            </div>
          </div>
          {!isReviewDashboard && (
            <div className="col-xl-3 col-12 order-xl-1 order-0 d-flex align-items-start justify-content-end">
              <Button
                label={
                  <>
                    <FontAwesomeIcon icon={faPlus} className="plus-icon me-2" />
                    Create advisory / closure
                  </>
                }
                styling="bcgov-normal-blue btn mt-3"
                onClick={() => {
                  setToCreate(true);
                }}
              />
            </div>
          )}
        </div>
        {!isReviewDashboard && (
          <div className="row">
            <div className="col-12">
              <Form.Check
                className="advisory-archived-toggle mt-3"
                type="checkbox"
                id="show-archived"
                checked={showArchived}
                onChange={(e) => {
                  setShowArchived(e.target.checked);
                  resetToFirstPage();
                }}
                label={
                  <span>
                    Show advisories and closures that have not been updated in
                    30 days
                    <LightTooltip
                      arrow
                      title="By default, inactive advisories and closures that have not been modified in the past 30 days are hidden. Check this
                   box to include inactive advisories and closures."
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
          </div>
        )}
        <FilterStatus
          totalResults={totalPublicAdvisories}
          selectedDistrict={selectedDistrict}
          onClearDistrict={clearDistrictFilter}
          selectedRegion={selectedRegion}
          onClearRegion={clearRegionFilter}
          selectedPark={selectedPark}
          onClearPark={clearParkFilter}
          selectedTableFilters={activeTableFilters}
          onClearTableFilter={clearTableFilter}
          showArchived={showArchived}
          onClearShowArchived={clearShowArchivedFilter}
          hasAnyFilters={
            selectedDistrict.length > 0 ||
            selectedRegion.length > 0 ||
            selectedPark.length > 0 ||
            showArchived ||
            activeTableFilters.length > 0
          }
          onClearAll={clearAllFilters}
        />
        <div className="advisory-dashboard" data-testid="AdvisoryDashboard">
          <br />
          <div className="advisory-dashboard-table-wrap">
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
                resetToFirstPage();
              }}
              onFilterChange={({ field, value }) => {
                setTableFilterValues((prev) => ({ ...prev, [field]: value }));
                resetToFirstPage();
              }}
              onSortChange={(next) => {
                setSortConfig(next);
                resetToFirstPage();
              }}
              initialFilterValues={initialTableFilterValues}
              filterValues={tableFilterValues}
              onFilterValuesChange={persistTableFilterValues}
              columns={tableColumns}
              data={publicAdvisories}
              emptyState={emptyState}
              title=""
              components={{
                Toolbar: () => <div></div>,
              }}
            />
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="page-loader">
          <Loader page />
        </div>
      )}
    </div>
  );
}

AdvisoryDashboard.propTypes = {
  filterStorageKey: PropTypes.string,
  isReviewDashboard: PropTypes.bool,
};
