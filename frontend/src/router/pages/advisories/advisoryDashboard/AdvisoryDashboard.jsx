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
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import LightTooltip from "@/components/advisories/shared/tooltip/LightTooltip";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import HelpIcon from "@mui/icons-material/Help";
import ArchiveIcon from "@mui/icons-material/Archive";
import PublishIcon from "@mui/icons-material/Publish";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { FormControlLabel, Checkbox, SvgIcon } from "@mui/material";

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

  if (!keycloak && !initialized) setToError(true);

  useEffect(() => {
    filterAdvisoriesByRegionId(selectedRegionId);
  }, [selectedRegionId, originalPublicAdvisories]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedParkId !== -1) {
      filterAdvisoriesByParkId(selectedParkId);
    }
  }, [selectedParkId, regionalPublicAdvisories]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const filters = JSON.parse(localStorage.getItem("advisoryFilters"));

    if (filters) {
      setFilters([...filters]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("advisoryFilters", JSON.stringify(filters));
    sessionStorage.setItem("showArchived", showArchived);
  }, [filters, showArchived]);

  const getPageFilterValue = (filters, filterName) =>
    filters.find((obj) => obj.type === "page" && obj.filterName === filterName)
      ?.filterValue || 0;
  /*-------------------------------------------------------------------------*/

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      if (initialized && keycloak) {
        const filters = JSON.parse(localStorage.getItem("advisoryFilters"));
        const archived = sessionStorage.getItem("showArchived") === "true";

        setShowArchived(archived);
        const res = await Promise.all([
          getRegions(cmsData, setCmsData),
          getManagementAreas(cmsData, setCmsData),
          getProtectedAreas(cmsData, setCmsData),
          getLatestPublicAdvisoryAudits(keycloakToken, archived),
        ]).catch(() => {
          setError({
            status: 500,
            message: "Error loading data. Make sure Strapi is running.",
          });
          setToError(true);
          setIsLoading(false);
        });

        // If no response, return
        if (!res) return;
        // Regions
        const regionsData = res[0];
        // Management Areas
        const managementAreasData = res[1];
        // Protected Areas
        const protectedAreasData = res[2];
        const publicAdvisories = res[3]?.data.data;
        // Public Advisories
        const updatedPublicAdvisories = updatePublicAdvisories(
          publicAdvisories,
          managementAreasData,
        );

        if (isMounted) {
          // Published Advisories
          getCurrentPublishedAdvisories(cmsData, setCmsData);
          setRegions([...regionsData]);
          setManagementAreas([...managementAreasData]);
          setProtectedAreas([...protectedAreasData]);
          setOriginalProtectedAreas([...protectedAreasData]);
          setPublicAdvisories(updatedPublicAdvisories);
          setOriginalPublicAdvisories(updatedPublicAdvisories);

          // Preserve filters
          const regionId = getPageFilterValue(filters, "region");

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

          const parkId = getPageFilterValue(filters, "park");

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
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [initialized, keycloak, cmsData, setCmsData, setError]);

  const removeDuplicatesById = (arr) =>
    arr.filter(
      (obj, index, self) => index === self.findIndex((o) => o.id === obj.id),
    );

  const filterAdvisoriesByParkId = (pId) => {
    const advisories = selectedRegionId
      ? regionalPublicAdvisories
      : originalPublicAdvisories;

    if (pId) {
      const filteredPublicAdvsories = [];
      const currentParkObj = protectedAreas.find((o) => o.documentId === pId);

      advisories.forEach((obj) => {
        if (
          obj.protectedAreas.some(
            (p) => p.documentId === currentParkObj.documentId,
          )
        ) {
          filteredPublicAdvsories.push(obj);
        }
      });
      setPublicAdvisories([...filteredPublicAdvsories]);
    } else {
      setPublicAdvisories([...advisories]);
    }
  };

  const filterAdvisoriesByRegionId = (regId) => {
    if (regId) {
      const filteredManagementAreas = managementAreas.filter(
        (m) => m.region?.id === regId,
      );

      // Filter park names dropdown list
      let list = [];

      filteredManagementAreas.forEach((obj) => {
        list = [...list.concat(obj.protectedAreas)];
      });

      // Remove duplicates
      const filteredProtectedAreas = removeDuplicatesById(list);

      // Filter advisories in grid
      const filteredPublicAdvsories = [];

      originalPublicAdvisories.forEach((obj) => {
        obj.protectedAreas.forEach((p) => {
          const idx = filteredProtectedAreas.findIndex(
            (o) => o?.orcs === p?.orcs,
          );

          if (idx !== -1) {
            filteredPublicAdvsories.push(obj);
          }
        });
      });

      setProtectedAreas([...filteredProtectedAreas]);
      setProtectedAreas([...originalProtectedAreas]);
      setPublicAdvisories([...removeDuplicatesById(filteredPublicAdvsories)]);
      setRegionalPublicAdvisories([
        ...removeDuplicatesById(filteredPublicAdvsories),
      ]);
    } else {
      setProtectedAreas([...originalProtectedAreas]);
      setPublicAdvisories([...originalPublicAdvisories]);
      setRegionalPublicAdvisories([...originalPublicAdvisories]);
    }
  };

  const getCurrentPublishedAdvisories = async (cmsData, setCmsData) => {
    const advisoryStatuses = await getAdvisoryStatuses(cmsData, setCmsData);
    const urgencies = await getUrgencies(cmsData, setCmsData);

    setAdvisoryStatuses(advisoryStatuses);
    setUrgencies(urgencies);
    if (advisoryStatuses) {
      const publishedStatus = advisoryStatuses.filter(
        (as) => as.code === "PUB",
      );

      if (publishedStatus?.length > 0) {
        const result = await cmsAxios
          .get(
            `/public-advisories?filters[advisoryStatus][code]=PUB&fields[0]=advisoryNumber&pagination[limit]=-1&sort=createdAt:DESC`,
          )
          .catch(() => {
            setHasErrors(true);
          });

        let publishedAdvisories = [];
        const res = result?.data?.data;

        if (res.length > 0) {
          res.forEach((ad) => {
            publishedAdvisories = [...publishedAdvisories, ad.advisoryNumber];
          });
        }
        setPublishedAdvisories([...publishedAdvisories]);
      }
    }
  };

  const toggleArchivedAdvisories = async (showArchived) => {
    setShowArchived(showArchived);
    setIsLoading(true);
    setPublicAdvisories([]);

    let res = null;

    try {
      res = await getLatestPublicAdvisoryAudits(keycloakToken, showArchived);
    } catch {
      setError({ status: 500, message: "Error loading data" });
      setToError(true);
      setIsLoading(false);
    }

    const publicAdvisories = res?.data.data;
    const updatedPublicAdvisories = updatePublicAdvisories(
      publicAdvisories,
      cmsData.managementAreas,
    );

    setPublicAdvisories(updatedPublicAdvisories);
    setOriginalPublicAdvisories(updatedPublicAdvisories);
    setIsLoading(false);
  };

  // Convert ISO date to YYYY/MM/DD format for filtering
  const filterFormattedDate = (filterDate, rowData, column) => {
    const value = rowData[column.field];

    if (!filterDate) return true;
    if (!value) return false;

    return moment(value)
      .format("YYYY/MM/DD")
      .toLowerCase()
      .includes(filterDate.toLowerCase());
  };

  const tableColumns = useMemo(
    () => [
      {
        field: "urgency.urgency",
        title: (
          <Tooltip title="Urgency">
            <WarningRoundedIcon className="warningRoundedIcon" />
          </Tooltip>
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
          if (rowData.urgency !== null) {
            switch (rowData.urgency?.urgency?.toLowerCase()) {
              case "low":
                return {
                  borderLeft: "8px solid #2454a4",
                };
              case "medium":
                return {
                  borderLeft: "8px solid #f5d20e",
                };
              case "high":
                return {
                  borderLeft: "8px solid #f30505",
                };
              default:
                return {};
            }
          }
        },
        render(rowData) {
          return (
            <>
              <Tooltip
                title={
                  rowData.urgency ? rowData.urgency.urgency : "Urgency not set"
                }
              >
                <div className="urgency-column">&nbsp;</div>
              </Tooltip>
            </>
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
        customSort: (a, b) =>
          a.archived === b.archived
            ? a.advisoryStatus.advisoryStatus < b.advisoryStatus.advisoryStatus
              ? -1
              : 1
            : a.archived < b.archived
              ? 1
              : -1,
        cellStyle: {
          textAlign: "center",
        },
        render: (rowData) => (
          <div className="advisory-status">
            {rowData.advisoryStatus && !rowData.archived && (
              <Tooltip title={rowData.advisoryStatus.advisoryStatus}>
                <span>
                  {publishedAdvisories.includes(rowData.advisoryNumber) && (
                    <SvgIcon>
                      {rowData.advisoryStatus.code !== "PUB" && (
                        <PublishIcon
                          className="publishedIcon"
                          viewBox="5 13 25 5"
                        />
                      )}
                      {rowData.advisoryStatus.code === "DFT" && (
                        <EditIcon
                          className="draftIcon"
                          viewBox="-16 -5 45 10"
                        />
                      )}
                      {rowData.advisoryStatus.code === "INA" && (
                        <WatchLaterIcon
                          className="inactiveIcon"
                          viewBox="-16 -5 45 10"
                        />
                      )}
                      {rowData.advisoryStatus.code === "APR" && (
                        <ThumbUpIcon
                          className="approvedIcon"
                          viewBox="-16 -5 45 10"
                        />
                      )}
                      {rowData.advisoryStatus.code === "ARQ" && (
                        <InfoIcon
                          className="approvalRequestedIcon"
                          viewBox="-16 -5 45 10"
                        />
                      )}
                      {rowData.advisoryStatus.code === "PUB" && (
                        <PublishIcon className="publishedIcon" />
                      )}
                    </SvgIcon>
                  )}
                  {!publishedAdvisories.includes(rowData.advisoryNumber) && (
                    <>
                      {rowData.advisoryStatus.code === "DFT" && (
                        <EditIcon className="draftIcon" />
                      )}
                      {rowData.advisoryStatus.code === "INA" && (
                        <WatchLaterIcon className="inactiveIcon" />
                      )}
                      {rowData.advisoryStatus.code === "APR" && (
                        <ThumbUpIcon className="approvedIcon" />
                      )}
                      {rowData.advisoryStatus.code === "ARQ" && (
                        <InfoIcon className="approvalRequestedIcon" />
                      )}
                      {rowData.advisoryStatus.code === "PUB" && (
                        <PublishIcon className="publishedIcon" />
                      )}
                    </>
                  )}
                </span>
              </Tooltip>
            )}
            {rowData.archived && (
              <Tooltip title="Archived">
                <span>
                  <SvgIcon>
                    <ArchiveIcon className="archivedIcon" />
                  </SvgIcon>
                </span>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        field: "advisoryDate",
        title: "Posting date",
        customFilterAndSearch: filterFormattedDate,
        render(rowData) {
          if (rowData.advisoryDate)
            return moment(rowData.advisoryDate).format("YYYY/MM/DD");
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
        },
      },
      {
        field: "expiryDate",
        title: "Expiry date",
        customFilterAndSearch: filterFormattedDate,
        render(rowData) {
          if (rowData.expiryDate)
            return moment(rowData.expiryDate).format("YYYY/MM/DD");
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
            const regions = rowData?.regions?.slice(0, displayCount);

            return (
              <div>
                {regions?.map((p, i) => (
                  <span key={i}>
                    {p.regionName} region
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${p.count} parks`}
                    />
                  </span>
                ))}
                {regionsCount > displayCount && (
                  <Tooltip
                    title={`plus ${regionsCount - displayCount} more region(s)`}
                  >
                    <Chip
                      size="small"
                      label={`+${regionsCount - displayCount}`}
                    />
                  </Tooltip>
                )}
              </div>
            );
          }

          const parksCount = rowData.protectedAreas.length;
          const protectedAreas = rowData.protectedAreas.slice(0, displayCount);

          return (
            <div>
              {protectedAreas.map((p, i) => (
                <span key={i}>
                  {p.protectedAreaName}
                  {protectedAreas.length - 1 > i && ", "}
                </span>
              ))}
              {parksCount > displayCount && (
                <Tooltip
                  title={`plus ${parksCount - displayCount} more park(s)`}
                >
                  <Chip size="small" label={`+${parksCount - displayCount}`} />
                </Tooltip>
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
          width: 10,
          maxWidth: 10,
          minWidth: 10,
        },
        cellStyle: {
          width: 10,
          maxWidth: 10,
          minWidth: 10,
          textAlign: "right",
          paddingRight: "10px",
        },
        render: (rowData) => (
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        ),
      },
    ],
    [urgencies, advisoryStatuses, publishedAdvisories],
  );

  if (toCreate) {
    return <Navigate to="/create-advisory" />;
  }
  if (toError || hasErrors) {
    console.log("toError || hasErrors", toError, hasErrors);
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
              options={regions.map((r) => ({
                label: `${r.regionName} Region`,
                value: r.id,
              }))}
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
            />
          </div>
          <div className="col-xl-5 col-md-4 col-sm-12">
            <Select
              value={selectedPark}
              options={protectedAreas.map((p) => ({
                label: p.protectedAreaName,
                value: p.documentId,
              }))}
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
            />
          </div>
          <div className="col-xl-3 col-md-4 col-sm-12">
            <FormControlLabel
              className="ms-1"
              control={
                <Checkbox
                  checked={showArchived}
                  onChange={(e) => {
                    const showArchived = e ? e.target.checked : false;

                    sessionStorage.setItem("showArchived", showArchived);
                    toggleArchivedAdvisories(showArchived);
                  }}
                  inputProps={{ "aria-label": "archived" }}
                />
              }
              label={
                <>
                  <small>Show archived</small>
                  <LightTooltip
                    arrow
                    title="By default, inactive advisories that have not been modified in the past 30 days are hidden. Check this
                   box to include inactive advisories modified in the past 18 months. Older advisories are available in Strapi."
                  >
                    <HelpIcon className="helpIcon ms-1" />
                  </LightTooltip>
                </>
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
              onFilterChange={(filters) => {
                const advisoryFilters = JSON.parse(
                  localStorage.getItem("advisoryFilters"),
                );
                const arrFilters = filters.map((obj) => ({
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
                Toolbar: (props) => <div></div>,
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
