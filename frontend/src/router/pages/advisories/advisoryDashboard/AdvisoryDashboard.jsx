import { useState, useEffect, useMemo, useContext } from "react";
import { cmsAxios } from "@/lib/advisories/axios_config";
import { Navigate, useNavigate } from "react-router-dom";
import ErrorContext from "@/contexts/ErrorContext";
import CmsDataContext from "@/contexts/CmsDataContext";
import { useAuth } from "react-oidc-context";
import "./AdvisoryDashboard.scss";
import { Button } from "@/components/advisories/shared/button/Button";
import DataTable from "@/components/advisories/composite/dataTable/DataTable";
import Select from "react-select";
import moment from "moment";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import Badge from "react-bootstrap/Badge";
import Form from "react-bootstrap/Form";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import LightTooltip from "@/components/advisories/shared/tooltip/LightTooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpToLine } from "@fa-kit/icons/classic/regular";
import {
  faCircleInfo,
  faTriangleExclamation,
  faClock,
  faCircleQuestion,
  faPencil,
  faThumbsUp,
} from "@fa-kit/icons/classic/solid";

import {
  getRegions,
  getManagementAreas,
  getProtectedAreas,
  getAdvisoryStatuses,
  getUrgencies,
} from "@/lib/advisories/utils/CmsDataUtil";

import {
  getLatestPublicAdvisoryAudits,
  updatePublicAdvisories,
} from "@/lib/advisories/utils/AdvisoryDataUtil";

export default function AdvisoryDashboard() {
  const { setError } = useContext(ErrorContext);
  const { cmsData, setCmsData } = useContext(CmsDataContext);
  const navigate = useNavigate();
  const auth = useAuth();
  const initialized = !auth.isLoading;
  const keycloak = auth.isAuthenticated ? auth.user : null;
  const keycloakToken = auth.user?.access_token;
  const [toError, setToError] = useState(false);
  const [toCreate, setToCreate] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedParkId, setSelectedParkId] = useState(0);
  const [selectedPark, setSelectedPark] = useState(null);
  const [publishedAdvisories, setPublishedAdvisories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [originalPublicAdvisories, setOriginalPublicAdvisories] = useState([]);
  const [regionalPublicAdvisories, setRegionalPublicAdvisories] = useState([]);
  const [publicAdvisories, setPublicAdvisories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [managementAreas, setManagementAreas] = useState([]);
  const [protectedAreas, setProtectedAreas] = useState([]);
  const [originalProtectedAreas, setOriginalProtectedAreas] = useState([]);
  const [advisoryStatuses, setAdvisoryStatuses] = useState([]);
  const [urgencies, setUrgencies] = useState([]);

  useEffect(() => {
    if (initialized && !keycloak) {
      setToError(true);
    }
  }, [initialized, keycloak]);

  // Preserve filters
  const savedFilters = JSON.parse(localStorage.getItem("advisoryFilters"));
  const defaultPageFilters = [
    { filterName: "region", filterValue: "", type: "page" },
    { filterName: "park", filterValue: "", type: "page" },
  ];
  const [filters, setFilters] = useState([
    ...(savedFilters || defaultPageFilters),
  ]);

  const archived = sessionStorage.getItem("showArchived") === "true";
  const [showArchived, setShowArchived] = useState(archived);

  useEffect(() => {
    const storedFilters = JSON.parse(localStorage.getItem("advisoryFilters"));

    if (storedFilters) {
      setFilters([...storedFilters]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("advisoryFilters", JSON.stringify(filters));
    sessionStorage.setItem("showArchived", showArchived);
  }, [filters, showArchived]);

  function getPageFilterValue(storedFilters, filterName) {
    return (
      storedFilters.find(
        (obj) => obj.type === "page" && obj.filterName === filterName,
      )?.filterValue || 0
    );
  }

  function removeDuplicatesById(arr) {
    return arr.filter(
      (obj, index, self) => index === self.findIndex((o) => o.id === obj.id),
    );
  }

  function filterAdvisoriesByParkId(pId) {
    const advisories = selectedRegionId
      ? regionalPublicAdvisories
      : originalPublicAdvisories;

    if (pId) {
      const filteredPublicAdvisories = [];
      const currentParkObj = protectedAreas.find((o) => o.documentId === pId);

      advisories.forEach((obj) => {
        if (
          obj.protectedAreas.some(
            (park) => park.documentId === currentParkObj.documentId,
          )
        ) {
          filteredPublicAdvisories.push(obj);
        }
      });
      setPublicAdvisories([...filteredPublicAdvisories]);
    } else {
      setPublicAdvisories([...advisories]);
    }
  }

  function filterAdvisoriesByRegionId(regId) {
    if (regId) {
      const filteredManagementAreas = managementAreas.filter(
        (managementArea) => managementArea.region?.id === regId,
      );

      // Filter park names dropdown list
      let list = [];

      filteredManagementAreas.forEach((obj) => {
        list = [...list.concat(obj.protectedAreas)];
      });

      // Remove duplicates
      const filteredProtectedAreas = removeDuplicatesById(list);

      // Filter advisories in grid
      const filteredPublicAdvisories = [];

      originalPublicAdvisories.forEach((obj) => {
        obj.protectedAreas.forEach((park) => {
          const idx = filteredProtectedAreas.findIndex(
            (protectedArea) => protectedArea?.orcs === park?.orcs,
          );

          if (idx !== -1) {
            filteredPublicAdvisories.push(obj);
          }
        });
      });

      setProtectedAreas([...filteredProtectedAreas]);
      setPublicAdvisories([...removeDuplicatesById(filteredPublicAdvisories)]);
      setRegionalPublicAdvisories([
        ...removeDuplicatesById(filteredPublicAdvisories),
      ]);
    } else {
      setProtectedAreas([...originalProtectedAreas]);
      setPublicAdvisories([...originalPublicAdvisories]);
      setRegionalPublicAdvisories([...originalPublicAdvisories]);
    }
  }

  async function toggleArchivedAdvisories(shouldShowArchived) {
    setShowArchived(shouldShowArchived);
    setIsLoading(true);
    setPublicAdvisories([]);

    let res = null;

    try {
      res = await getLatestPublicAdvisoryAudits(
        keycloakToken,
        shouldShowArchived,
      );
    } catch {
      setError({ status: 500, message: "Error loading data" });
      setToError(true);
      setIsLoading(false);
    }

    const advisoryAuditRows = res?.data.data;
    const updatedPublicAdvisories = updatePublicAdvisories(
      advisoryAuditRows,
      cmsData.managementAreas,
    );

    setPublicAdvisories(updatedPublicAdvisories);
    setOriginalPublicAdvisories(updatedPublicAdvisories);
    setIsLoading(false);
  }

  function filterFormattedDate(filterDate, rowData, column) {
    const value = rowData[column.field];

    if (!filterDate) {
      return true;
    }
    if (!value) {
      return false;
    }

    return moment(value)
      .format("YYYY/MM/DD")
      .toLowerCase()
      .includes(filterDate.toLowerCase());
  }

  function renderCountBadge(label) {
    return (
      <Badge pill bg="light" text="dark" className="park-count-badge">
        {label}
      </Badge>
    );
  }

  useEffect(() => {
    filterAdvisoriesByRegionId(selectedRegionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Region filtering intentionally derives from the selected region id and the base advisory list.
  }, [selectedRegionId, originalPublicAdvisories]);

  useEffect(() => {
    if (selectedParkId !== -1) {
      filterAdvisoriesByParkId(selectedParkId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Park filtering intentionally derives from the selected park id and the region-scoped advisory list.
  }, [selectedParkId, regionalPublicAdvisories]);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentPublishedAdvisories() {
      const fetchedAdvisoryStatuses = await getAdvisoryStatuses(
        cmsData,
        setCmsData,
      );
      const fetchedUrgencies = await getUrgencies(cmsData, setCmsData);

      setAdvisoryStatuses(fetchedAdvisoryStatuses);
      setUrgencies(fetchedUrgencies);
      if (fetchedAdvisoryStatuses) {
        const publishedStatus = fetchedAdvisoryStatuses.filter(
          (status) => status.code === "PUB",
        );

        if (publishedStatus?.length > 0) {
          const result = await cmsAxios
            .get(
              `/public-advisories?filters[advisoryStatus][code]=PUB&fields[0]=advisoryNumber&pagination[limit]=-1&sort=createdAt:DESC`,
            )
            .catch(() => {
              setHasErrors(true);
            });

          let currentPublishedAdvisories = [];
          const responseData = result?.data?.data ?? [];

          if (responseData.length > 0) {
            responseData.forEach((advisory) => {
              currentPublishedAdvisories = [
                ...currentPublishedAdvisories,
                advisory.advisoryNumber,
              ];
            });
          }
          setPublishedAdvisories([...currentPublishedAdvisories]);
        }
      }
    }

    async function fetchData() {
      setIsLoading(true);
      if (initialized && keycloak) {
        const storedFilters = JSON.parse(
          localStorage.getItem("advisoryFilters"),
        );
        const archivedSetting =
          sessionStorage.getItem("showArchived") === "true";

        setShowArchived(archivedSetting);
        const res = await Promise.all([
          getRegions(cmsData, setCmsData),
          getManagementAreas(cmsData, setCmsData),
          getProtectedAreas(cmsData, setCmsData),
          getLatestPublicAdvisoryAudits(keycloakToken, archivedSetting),
        ]).catch(() => {
          setError({
            status: 500,
            message: "Error loading data. Make sure Strapi is running.",
          });
          setToError(true);
          setIsLoading(false);
        });

        // If no response, return
        if (!res) {
          return;
        }
        // Regions
        const regionsData = res[0];
        // Management Areas
        const managementAreasData = res[1];
        // Protected Areas
        const protectedAreasData = res[2];
        const advisoryAuditRows = res[3]?.data.data;
        // Public Advisories
        const updatedPublicAdvisories = updatePublicAdvisories(
          advisoryAuditRows,
          managementAreasData,
        );

        if (isMounted) {
          // Published Advisories
          loadCurrentPublishedAdvisories();
          setRegions([...regionsData]);
          setManagementAreas([...managementAreasData]);
          setProtectedAreas([...protectedAreasData]);
          setOriginalProtectedAreas([...protectedAreasData]);
          setPublicAdvisories(updatedPublicAdvisories);
          setOriginalPublicAdvisories(updatedPublicAdvisories);

          // Preserve filters
          const regionId = getPageFilterValue(storedFilters || [], "region");

          if (regionId) {
            const region = regionsData.find((r) => r.id === regionId);

            if (region) {
              setSelectedRegionId(regionId);
              setSelectedRegion({
                label: `${region.regionName} Region`,
                value: region.id,
              });
            }
          }

          const parkId = getPageFilterValue(storedFilters || [], "park");

          if (parkId) {
            const park = protectedAreasData.find(
              (p) => p.documentId === parkId,
            );

            if (park) {
              setSelectedParkId(parkId);
              setSelectedPark({
                label: park.protectedAreaName,
                value: park.documentId,
              });
            }
          }
        }
      }
      setIsLoading(false);
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [initialized, keycloak, keycloakToken, cmsData, setCmsData, setError]);

  const regionOptions = useMemo(
    () =>
      regions.map((r) => ({ label: `${r.regionName} Region`, value: r.id })),
    [regions],
  );

  const parkOptions = useMemo(
    () =>
      protectedAreas.map((p) => ({
        label: p.protectedAreaName,
        value: p.documentId,
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
        customSort(a, b) {
          const urgencyRank = {
            low: 1,
            medium: 2,
            high: 3,
          };

          const leftRank = urgencyRank[a.urgency?.urgency?.toLowerCase()] || 0;
          const rightRank = urgencyRank[b.urgency?.urgency?.toLowerCase()] || 0;

          return leftRank - rightRank;
        },
        headerStyle: {
          width: urgencyColumnWidth,
        },
        cellStyle(e, rowData) {
          const widthStyle = {
            width: urgencyColumnWidth,
          };

          if (rowData.urgency !== null) {
            switch (rowData.urgency?.urgency?.toLowerCase()) {
              case "low":
                return {
                  ...widthStyle,
                  borderLeft: "8px solid #2454a4",
                };
              case "medium":
                return {
                  ...widthStyle,
                  borderLeft: "8px solid #f5d20e",
                };
              case "high":
                return {
                  ...widthStyle,
                  borderLeft: "8px solid #f30505",
                };
              default:
                return widthStyle;
            }
          }

          return widthStyle;
        },
        render(rowData) {
          return (
            <OverlayTrigger
              placement="top"
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
        customSort(a, b) {
          if (a.archived !== b.archived) {
            return a.archived < b.archived ? 1 : -1;
          }

          return a.advisoryStatus.advisoryStatus <
            b.advisoryStatus.advisoryStatus
            ? -1
            : 1;
        },
        headerStyle: {
          width: statusColumnWidth,
        },
        cellStyle: {
          textAlign: "center",
          width: statusColumnWidth,
        },
        render(rowData) {
          const statusIconMap = {
            DFT: { icon: faPencil, className: "draftIcon" },
            INA: { icon: faClock, className: "inactiveIcon" },
            APR: { icon: faThumbsUp, className: "approvedIcon" },
            ARQ: { icon: faCircleInfo, className: "approvalRequestedIcon" },
            PUB: { icon: faArrowUpToLine, className: "publishedIcon" },
          };
          const code = rowData.advisoryStatus?.code;
          const statusEntry = statusIconMap[code];
          const isPublished = publishedAdvisories.includes(
            rowData.advisoryNumber,
          );

          // Two icons when the advisory already has a live published version
          // but is currently in a different status (A = published indicator, B = current status)
          const showDual = isPublished && code !== "PUB" && statusEntry;

          return (
            <div className="advisory-status">
              {rowData.advisoryStatus && !rowData.archived && (
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id={`status-${rowData.documentId || rowData.id}`}>
                      {rowData.advisoryStatus.advisoryStatus}
                    </Tooltip>
                  }
                >
                  <span>
                    {showDual ? (
                      <span className="dual-icon">
                        <FontAwesomeIcon
                          icon={faArrowUpToLine}
                          className="icon-a publishedIcon"
                        />
                        <FontAwesomeIcon
                          icon={statusEntry.icon}
                          className={`icon-b ${statusEntry.className}`}
                        />
                      </span>
                    ) : (
                      statusEntry && (
                        <FontAwesomeIcon
                          icon={statusEntry.icon}
                          className={statusEntry.className}
                        />
                      )
                    )}
                  </span>
                </OverlayTrigger>
              )}
              {rowData.archived && (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip
                      id={`archived-${rowData.documentId || rowData.id}`}
                    >
                      Archived
                    </Tooltip>
                  }
                >
                  <span>
                    <FontAwesomeIcon icon={faClock} className="inactiveIcon" />
                  </span>
                </OverlayTrigger>
              )}
            </div>
          );
        },
      },
      {
        field: "advisoryDate",
        title: "Posting date",
        customFilterAndSearch: filterFormattedDate,
        render(rowData) {
          if (rowData.advisoryDate) {
            return moment(rowData.advisoryDate).format("YYYY/MM/DD");
          }

          return null;
        },
      },
      {
        field: "endDate",
        title: "End date",
        customFilterAndSearch: filterFormattedDate,
        render(rowData) {
          if (rowData.endDate) {
            return moment(rowData.endDate).format("YYYY/MM/DD");
          }

          return null;
        },
      },
      {
        field: "expiryDate",
        title: "Expiry date",
        customFilterAndSearch: filterFormattedDate,
        render(rowData) {
          if (rowData.expiryDate) {
            return moment(rowData.expiryDate).format("YYYY/MM/DD");
          }

          return null;
        },
      },
      {
        field: "title",
        title: "Headline",
        customSort: (a, b) =>
          a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1,
        headerStyle: { width: 400 },
        cellStyle: { width: 400 },
        render(rowData) {
          return (
            <div dangerouslySetInnerHTML={{ __html: rowData.title }}></div>
          );
        },
      },
      { field: "eventType.eventType", title: "Event type" },
      {
        field: "associatedParks",
        title: "Associated Park(s)",
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

          const parksCount = rowData.protectedAreas.length;
          const displayedProtectedAreas = rowData.protectedAreas.slice(
            0,
            displayCount,
          );

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
    [
      urgencies,
      advisoryStatuses,
      publishedAdvisories,
      urgencyColumnWidth,
      statusColumnWidth,
    ],
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
          <div className="col-lg-6 col-md-4 col-sm-12">
            <h4 className="float-left">Public Advisories</h4>
          </div>
          <div className="col-lg-6 col-md-4 col-sm-12 text-end">
            <Button
              label="Create a new Advisory"
              styling="bcgov-normal-yellow btn"
              onClick={() => {
                sessionStorage.clear();
                setToCreate(true);
              }}
            />
          </div>
        </div>
        <div className="row ad-row">
          <div className="col-xl-4 col-md-4 col-sm-12">
            <Select
              value={selectedRegion}
              options={regionOptions}
              onChange={(e) => {
                setSelectedRegion(e);
                setSelectedRegionId(e ? e.value : 0);

                setSelectedPark(null);
                setSelectedParkId(-1); // Do not filter by parkId

                const arr = [...filters.filter((o) => !(o.type === "page"))];

                setFilters([
                  ...arr,
                  {
                    type: "page",
                    filterName: "region",
                    filterValue: e ? e.value : 0,
                  },
                  { type: "page", filterName: "park", filterValue: 0 }, // Reset park filter
                ]);
              }}
              placeholder="Select a Region..."
              className="bcgov-select"
              isClearable
              styles={{
                menu: (base) => ({ ...base, zIndex: 999 }),
              }}
            />
          </div>
          <div className="col-xl-5 col-md-4 col-sm-12">
            <Select
              value={selectedPark}
              options={parkOptions}
              onChange={(e) => {
                setSelectedPark(e);
                setSelectedParkId(e ? e.value : 0);

                const arr = [
                  ...filters.filter(
                    (o) => !(o.type === "page" && o.filterName === "park"),
                  ),
                ];

                setFilters([
                  ...arr,
                  {
                    type: "page",
                    filterName: "park",
                    filterValue: e ? e.value : 0,
                  },
                ]);
              }}
              placeholder="Select a Park..."
              className="bcgov-select"
              isClearable
              styles={{
                menu: (base) => ({ ...base, zIndex: 999 }),
              }}
            />
          </div>
          <div className="col-xl-3 col-md-4 col-sm-12">
            <Form.Check
              className="ms-1 advisory-archived-toggle"
              type="checkbox"
              id="show-archived"
              checked={showArchived}
              onChange={(e) => {
                const shouldShowArchived = e ? e.target.checked : false;

                sessionStorage.setItem("showArchived", shouldShowArchived);
                toggleArchivedAdvisories(shouldShowArchived);
              }}
              label={
                <span>
                  <small>Show archived</small>
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
        </div>
      </div>
      {
        <div className="advisory-dashboard" data-testid="AdvisoryDashboard">
          <br />
          <div className="container-fluid">
            <DataTable
              options={{
                debounceInterval: 75,
                filtering: true,
                search: false,
                pageSize: 50,
                pageSizeOptions: [25, 50, publicAdvisories.length],
              }}
              onFilterChange={(tableFilters) => {
                const advisoryFilters = JSON.parse(
                  localStorage.getItem("advisoryFilters"),
                );
                const arrFilters = tableFilters.map((obj) => ({
                  fieldName: obj.column.field,
                  fieldValue: obj.value,
                  type: "table",
                }));

                setFilters([
                  ...advisoryFilters.filter((o) => o.type === "page"),
                  ...arrFilters,
                ]);
              }}
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
