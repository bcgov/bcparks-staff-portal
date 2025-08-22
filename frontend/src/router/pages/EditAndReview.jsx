import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faFilter } from "@fa-kit/icons/classic/solid";
import { useApiGet } from "@/hooks/useApi";
import useConfirmation from "@/hooks/useConfirmation";
import EditAndReviewTable from "@/components/EditAndReviewTable";
import LoadingBar from "@/components/LoadingBar";
import MultiSelect from "@/components/MultiSelect";
import { useMemo, useState, useContext } from "react";
import PaginationBar from "@/components/PaginationBar";
import FilterPanel from "@/components/FilterPanel";
import FormPanel from "@/components/FormPanel";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import RefreshTableContext from "@/contexts/RefreshTableContext";
import UserContext from "@/contexts/UserContext";

function EditAndReview() {
  const { data, loading, error, fetchData } = useApiGet("/parks");
  const {
    data: filterOptionsData,
    loading: filterOptionsLoading,
    error: filterOptionsError,
  } = useApiGet("/filter-options");
  const parks = useMemo(() => data ?? [], [data]);
  const filterOptions = filterOptionsData ?? {};
  const { data: userData } = useContext(UserContext);

  const statusOptions = [
    { value: "requested", label: "Requested by HQ" },
    { value: "pending review", label: "Pending HQ review" },
    { value: "approved", label: "Approved" },
    { value: "published", label: "Published" },
  ];

  // table pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // table filter state
  const [filters, setFilters] = useState({
    name: "",
    accessGroups: [],
    status: [],
    sections: [],
    managementAreas: [],
    dateTypes: [],
    featureTypes: [],
    isInReservationSystem: false,
    hasDateNote: false,
  });
  const [formData, setFormData] = useState({});
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const modal = useConfirmation();

  // open form panel when the Edit button is clicked
  async function formPanelHandler(formDataObj) {
    const status = formDataObj.currentSeason.status;

    // If the season is already approved, prompt to continue
    if (status === "approved") {
      const proceed = await modal.open(
        "Edit approved dates?",
        "Dates will need to be reviewed again to be approved.",
        "Edit",
        "Cancel",
      );

      // If the user cancels in the confirmation modal, don't open the edit form
      if (!proceed) {
        return;
      }
    }
    // If the season is already published to the CMS, prompt to continue
    else if (status === "published") {
      const proceed = await modal.open(
        "Edit public dates on API?",
        "Dates will need to be reviewed again to be approved and published. If reservations have already begun, visitors will be affected.",
        "Continue to edit",
        "Cancel",
      );

      // If the user cancels in the confirmation modal, don't open the edit form
      if (!proceed) {
        return;
      }
    }

    setFormData({
      seasonId: formDataObj.currentSeason.id,
      level: formDataObj.level,
    });
    setShowFormPanel(true);
  }

  function resetFilters() {
    setPage(1);
    setFilters({
      name: "",
      accessGroups: [],
      status: [],
      sections: [],
      managementAreas: [],
      dateTypes: [],
      featureTypes: [],
      isInReservationSystem: false,
      hasDateNote: false,
    });
  }

  const filteredParks = useMemo(
    () =>
      parks.filter((park) => {
        // If a name filter is set, filter out parks that don't match
        if (
          filters.name.length > 0 &&
          !park.name
            .toLocaleLowerCase()
            .includes(filters.name.toLocaleLowerCase())
        ) {
          return false;
        }

        // filter by status
        if (filters.status.length > 0) {
          // gather all statuses to check
          const statusesToCheck = [];

          // check park.currentSeason
          if (park.currentSeason?.status) {
            statusesToCheck.push(park.currentSeason.status);
          }

          // check parkAreas.currentSeason
          if (Array.isArray(park.parkAreas)) {
            park.parkAreas.forEach((parkArea) => {
              if (parkArea.currentSeason?.status) {
                statusesToCheck.push(parkArea.currentSeason.status);
              }
            });
          }

          // check features.currentSeason
          if (Array.isArray(park.features)) {
            park.features.forEach((feature) => {
              if (feature.currentSeason?.status) {
                statusesToCheck.push(feature.currentSeason.status);
              }
            });
          }

          // if none of the statuses match, filter out
          if (
            !statusesToCheck.some((status) => filters.status.includes(status))
          ) {
            return false;
          }
        }

        // filter by access groups
        if (
          filters.accessGroups.length > 0 &&
          !filters.accessGroups.some((group) =>
            park.accessGroups.some((parkGroup) => parkGroup.id === group.id),
          )
        ) {
          return false;
        }

        // filter by user access groups through userData
        if (
          userData &&
          userData.accessGroups?.length > 0 &&
          !userData.accessGroups.some((group) =>
            park.accessGroups.some((parkGroup) => parkGroup.id === group.id),
          )
        ) {
          return false;
        }

        // filter by sections
        if (
          filters.sections.length > 0 &&
          !filters.sections.some((section) =>
            park.section.some(
              (parkSection) => parkSection.number === section.sectionNumber,
            ),
          )
        ) {
          return false;
        }

        // filter by management areas
        if (
          filters.managementAreas.length > 0 &&
          !filters.managementAreas.some((area) =>
            park.managementArea.some(
              (parkArea) => parkArea.number === area.managementAreaNumber,
            ),
          )
        ) {
          return false;
        }

        // filter by date types
        if (
          filters.dateTypes.length > 0 &&
          !filters.dateTypes.some((filterDateType) => {
            // check park.hasGate and dateTypes
            if (
              ["Gate", "Operating"].includes(filterDateType.name) &&
              !park.hasGate
            ) {
              return false;
            }
            // check park.hasTier1Dates, park.hasTier2Dates, park.hasWinterFeeDates, and dateTypes
            if (filterDateType.name === "Tier 1" && !park.hasTier1Dates) {
              return false;
            }
            if (filterDateType.name === "Tier 2" && !park.hasTier2Dates) {
              return false;
            }
            if (
              filterDateType.name === "Winter fee" &&
              !park.hasWinterFeeDates
            ) {
              return false;
            }
            // check feature.hasBackcountryPermits and dateTypes
            if (
              filterDateType.name === "Backcountry registration" &&
              !(
                park.features?.some(
                  (feature) => feature.hasBackcountryPermits,
                ) ||
                park.parkAreas?.some((parkArea) =>
                  parkArea.features?.some(
                    (feature) => feature.hasBackcountryPermits,
                  ),
                )
              )
            ) {
              return false;
            }

            // check park.seasons and dateTypes
            const hasParkDateType = park.seasons?.some((season) =>
              season.dateRanges?.some(
                (dateRange) => dateRange.dateType.id === filterDateType.id,
              ),
            );

            if (hasParkDateType) return true;

            // check parkAreas.seasons and dateTypes
            const hasParkAreaDateType = park.parkAreas?.some((parkArea) =>
              parkArea.seasons?.some((season) =>
                season.dateRanges?.some(
                  (dateRange) => dateRange.dateType.id === filterDateType.id,
                ),
              ),
            );

            if (hasParkAreaDateType) return true;

            // check parkAreas.features.seasons and dateTypes
            const hasParkAreaFeatureDateType = park.parkAreas?.some(
              (parkArea) =>
                parkArea.features?.some((feature) =>
                  feature.seasons?.some((season) =>
                    season.dateRanges?.some(
                      (dateRange) =>
                        dateRange.dateType.id === filterDateType.id,
                    ),
                  ),
                ),
            );

            if (hasParkAreaFeatureDateType) return true;

            // check features.seasons and dateTypes
            const hasFeatureDateType = park.features?.some((feature) =>
              feature.seasons?.some((season) =>
                season.dateRanges?.some(
                  (dateRange) => dateRange.dateType.id === filterDateType.id,
                ),
              ),
            );

            if (hasFeatureDateType) return true;

            return false;
          })
        ) {
          return false;
        }

        // filter by feature types
        if (
          filters.featureTypes.length > 0 &&
          !filters.featureTypes.some(
            (filterFeatureType) =>
              // check features.featureTypes
              park.features.some(
                (feature) => feature.featureType.id === filterFeatureType.id,
              ) ||
              // check parkAreas.featureTypes
              park.parkAreas?.some(
                (parkArea) => parkArea.featureType.id === filterFeatureType.id,
              ),
          )
        ) {
          return false;
        }

        // filter by isInReservationSystem
        // park level - check if it has hasTier1Dates, hasTier2Dates, or hasWinterFeeDates
        // area and feature level - check it it has inReservationSystem
        if (
          filters.isInReservationSystem &&
          !(
            park.hasTier1Dates ||
            park.hasTier2Dates ||
            park.hasWinterFeeDates ||
            park.parkAreas.some((parkArea) => parkArea.inReservationSystem) ||
            park.features.some((feature) => feature.inReservationSystem)
          )
        ) {
          return false;
        }

        // TODO: CMS-788
        // filter by hasDateNote

        return true;
      }),
    [parks, filters, userData],
  );

  function updateFilter(key, value) {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  }

  /**
   * Fetches all the data from the API when something changes.
   * @returns {void}
   */
  function refreshTable() {
    fetchData();
  }

  // Slice the list of parks for pagination
  const totalPages = useMemo(
    () => Math.ceil(filteredParks.length / pageSize),
    [filteredParks, pageSize],
  );
  const pageData = useMemo(() => {
    const start = pageSize * (page - 1);
    const end = start + pageSize;

    return filteredParks.slice(start, end);
  }, [filteredParks, page, pageSize]);

  // components
  function ParksTableWrapper() {
    if (loading) {
      return <LoadingBar />;
    }

    if (error) {
      return <p>Error loading parks data: {error.message}</p>;
    }

    return (
      <div className="paginated-table">
        <div className="mb-3">
          <RefreshTableContext.Provider value={{ refreshTable }}>
            <EditAndReviewTable
              data={pageData}
              onResetFilters={resetFilters}
              formPanelHandler={formPanelHandler}
            />
          </RefreshTableContext.Provider>
        </div>

        <div className="d-flex justify-content-center">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    );
  }

  // "filter by status" dropdown
  function StatusFilter() {
    return (
      <MultiSelect
        options={statusOptions}
        onInput={(value) => {
          setPage(1);
          updateFilter("status", value);
        }}
        value={filters.status}
      >
        Filter by status{" "}
        {filters.status.length > 0 && `(${filters.status.length})`}
      </MultiSelect>
    );
  }

  // "clear filters" button
  function ClearFilter() {
    return (
      <button
        type="button"
        onClick={resetFilters}
        className="btn text-link text-decoration-underline align-self-end"
      >
        Clear filters
      </button>
    );
  }

  return (
    <div className="container">
      <div className="page dates-management">
        <div className="table-filters row mb-4">
          <div className="col-lg-3 col-md-6 col-12 mb-2 mb-md-0">
            <label htmlFor="parkName" className="form-label">
              Park name
            </label>

            <div className="input-with-append">
              <input
                type="text"
                className="form-control input-search"
                id="parkName"
                placeholder="Search by park name"
                value={filters.name}
                onChange={(e) => {
                  setPage(1);
                  updateFilter("name", e.target.value);
                }}
              />
              <FontAwesomeIcon
                className="append-content"
                icon={faMagnifyingGlass}
              />
            </div>
          </div>

          <div className="col-12 col-md-auto d-flex">
            <div className="me-2">
              <label htmlFor="status" className="form-label">
                Status
              </label>
              <StatusFilter />
            </div>

            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="btn btn-outline-primary align-self-end me-2"
            >
              <FontAwesomeIcon icon={faFilter} className="me-1" />
              All filters
            </button>
            <ClearFilter />
          </div>
        </div>

        <ParksTableWrapper />

        <ConfirmationDialog {...modal.props} />

        <FormPanel
          show={showFormPanel}
          setShow={setShowFormPanel}
          formData={formData}
          onDataUpdate={refreshTable}
        />

        <FilterPanel
          show={showFilterPanel}
          setShow={setShowFilterPanel}
          filters={filters}
          updateFilter={updateFilter}
          filterOptions={filterOptions}
          filterOptionsLoading={filterOptionsLoading}
          filterOptionsError={filterOptionsError}
          statusFilter={<StatusFilter />}
          clearFilter={<ClearFilter />}
        />
      </div>
    </div>
  );
}

export default EditAndReview;
