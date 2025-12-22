import React, { useMemo, useContext } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { faCheck } from "@fa-kit/icons/classic/solid";
import { faPen } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatusBadge from "@/components/StatusBadge";
import NotReadyFlag from "@/components/NotReadyFlag";
import { formatDateRange } from "@/lib/utils";
import useAccess from "@/hooks/useAccess";
import { useApiPost } from "@/hooks/useApi";
import RefreshTableContext from "@/contexts/RefreshTableContext";
import globalFlashMessageContext from "@/contexts/FlashMessageContext";
import "./EditAndReviewTable.scss";
import * as FEATURE_TYPE from "../constants/featureType";
import * as DATE_TYPE from "../constants/dateType";
import * as SEASON_TYPE from "@/constants/seasonType";

// Components
function IconButton({
  icon,
  label,
  onClick,
  textColor,
  loading = false,
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      className={classNames("btn btn-text text-link", textColor)}
      disabled={disabled}
    >
      {/* Show a spinner instead of the icon while loading */}
      {loading ? (
        <span className="spinner-border spinner-border-sm me-1" role="status" />
      ) : (
        <FontAwesomeIcon icon={icon} />
      )}
      <span className="ms-1">{label}</span>
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  textColor: PropTypes.string,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};

// renders all date ranges for a given year as a list
// e.g. [{ startDate: "Mon Jan 1", endDate: "Tue Jan 2" }, { startDate: "Mon Dec 30", endDate: "Tue Dec 31" }]
// => Mon, 1 Jan – Tue, 2 Jan / Mon, 30 Dec – Tue, 31 Dec
function DateRangesList({ dateRanges, isLastYear }) {
  // leave it blank when date information is not available
  // display 'Not provided' when the year has passed and there are no dates
  if (!dateRanges || dateRanges.length === 0) {
    return isLastYear ? <span className="text-muted">Not provided</span> : null;
  }

  return (
    <ul className="list-unstyled mb-0">
      {[...dateRanges]
        .sort((a, b) => a.startDate - b.startDate)
        .map((dateRange) => (
          <li key={dateRange.id}>
            {formatDateRange(dateRange, isLastYear ? "Not provided" : "")}
            <NotReadyFlag show={!dateRange.readyToPublish} />
          </li>
        ))}
    </ul>
  );
}

DateRangesList.propTypes = {
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
      readyToPublish: PropTypes.bool.isRequired,
    }),
  ),
  isLastYear: PropTypes.bool,
};

function DateTypeTableRow({
  groupedDateRanges,
  currentYear,
  isWinterSeason = false,
}) {
  if (
    !currentYear ||
    !groupedDateRanges ||
    Object.keys(groupedDateRanges).length === 0
  )
    return null;

  const lastYear = currentYear - 1;
  const displayLastYear = isWinterSeason
    ? `${lastYear} – ${currentYear}`
    : lastYear;
  const displayCurrentYear = isWinterSeason
    ? `${currentYear} – ${currentYear + 1}`
    : currentYear;

  return (
    <tr className="table-row--date-type">
      <th scope="col">Type of date</th>
      <th scope="col">{displayLastYear}</th>
      <th scope="col">{displayCurrentYear}</th>
    </tr>
  );
}

DateTypeTableRow.propTypes = {
  groupedDateRanges: PropTypes.object,
  currentYear: PropTypes.number,
  isWinterSeason: PropTypes.bool,
};

function DateTableRow({ groupedDateRanges, currentYear }) {
  if (!currentYear || !groupedDateRanges) return null;

  // Helper to get the strapiDateTypeId from the first item in a groupedDateRange
  function getStrapiDateTypeId(datesObj) {
    const firstRange = Object.values(datesObj)[0]?.[0];

    return firstRange?.dateType?.strapiDateTypeId ?? Number.MAX_SAFE_INTEGER;
  }

  // Sort date types based on DATE_TYPE.SORT_ORDER
  const sortedDateTypes = Object.entries(groupedDateRanges).sort(
    ([, datesA], [, datesB]) =>
      DATE_TYPE.SORT_ORDER.indexOf(getStrapiDateTypeId(datesA)) -
      DATE_TYPE.SORT_ORDER.indexOf(getStrapiDateTypeId(datesB)),
  );

  return sortedDateTypes.map(([dateTypeName, yearsObj]) => (
    <tr key={dateTypeName} className="table-row--date">
      <td className="fw-bold">{dateTypeName}</td>
      <td>
        <DateRangesList
          dateRanges={yearsObj[currentYear - 1]}
          isLastYear={true}
        />
      </td>
      <td>
        <DateRangesList dateRanges={yearsObj[currentYear]} />
      </td>
    </tr>
  ));
}

DateTableRow.propTypes = {
  groupedDateRanges: PropTypes.object,
  currentYear: PropTypes.number,
};

function ApproveButton({ seasonId, status, color = "", onApprove }) {
  // disable the approve button if a season is already approved, published, or requested by HQ
  const isDisabled = status !== "pending review";
  const { refreshTable } = useContext(RefreshTableContext);
  const { sendData: sendApprove, loading: sendingApprove } = useApiPost(
    `/seasons/${seasonId}/approve/`,
  );

  async function approveSeason() {
    try {
      await sendApprove();

      // Refresh the main page data from the API
      await refreshTable();

      // Emit success to the parent component (to show a flash message)
      onApprove();
    } catch (error) {
      // @TODO: Catch API error and show a flash message
      console.error("Error approving season:", error);
    }
  }

  return (
    <IconButton
      icon={faCheck}
      label="Approve"
      textColor={color}
      onClick={approveSeason}
      loading={sendingApprove}
      disabled={isDisabled}
    />
  );
}

ApproveButton.propTypes = {
  seasonId: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
  color: PropTypes.string,
  onApprove: PropTypes.func.isRequired,
};

function StatusTableRow({
  id,
  level,
  nameCellClass,
  name,
  typeName,
  season,
  formPanelHandler,
  color,
}) {
  const flashMessage = useContext(globalFlashMessageContext);
  const isWinterSeason = season.seasonType === SEASON_TYPE.WINTER;
  // user role
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  /**
   * Displays a flash message when the Season's Dates are approved.
   * @returns {void}
   */
  function onApprove() {
    flashMessage.open(
      "Dates approved",
      `${name} ${season.operatingYear} dates marked as approved`,
    );
  }

  return (
    <tr
      key={id}
      className={classNames(
        level && `table-row--${level}`,
        isWinterSeason && "winter",
      )}
    >
      <th
        scope="col"
        colSpan="2"
        className={classNames("align-middle", nameCellClass)}
      >
        {name}
        {typeName && (
          <div className="fw-normal">
            <small>{typeName}</small>
          </div>
        )}
      </th>

      {season ? (
        <th scope="col" className="align-middle text-end text-nowrap">
          <div className="d-inline-block me-2">
            <StatusBadge status={season.status} />
          </div>

          <IconButton
            icon={faPen}
            label="Edit"
            onClick={formPanelHandler}
            textColor={color}
          />

          {approver && (
            <ApproveButton
              seasonId={season.id}
              status={season.status}
              color={color}
              onApprove={onApprove}
            />
          )}
        </th>
      ) : (
        <th scope="col" className="align-middle text-end text-nowrap">
          {/* No currentSeason: nothing to edit or approve */}
          &nbsp;
        </th>
      )}
    </tr>
  );
}

StatusTableRow.propTypes = {
  id: PropTypes.number,
  level: PropTypes.string,
  nameCellClass: PropTypes.string,
  name: PropTypes.string.isRequired,
  typeName: PropTypes.string,
  season: PropTypes.object,
  formPanelHandler: PropTypes.func,
  color: PropTypes.string,
};

function FeaturesByFeatureTypeWithAreas({
  featureTypeId,
  park,
  parkAreas,
  inReservationSystemFilter,
  formPanelHandler,
  featureTypeFilter,
}) {
  return (
    <>
      {/* 2 - park area level */}
      {parkAreas.map((parkArea) => {
        // filter out park areas not in reservation system if the filter is applied
        if (inReservationSystemFilter && !parkArea.inReservationSystem) {
          return null;
        }

        const regularSeason = parkArea.currentSeason.regular;

        return (
          parkArea.features.some((f) =>
            featureTypeFilter(f.featureType.strapiFeatureTypeId, featureTypeId),
          ) && (
            <React.Fragment key={parkArea.id}>
              <StatusTableRow
                id={parkArea.id}
                level="park-area"
                name={`${park.name} - ${parkArea.name}`}
                typeName={parkArea.featureType?.name}
                season={regularSeason}
                formPanelHandler={() =>
                  formPanelHandler({ ...parkArea, level: "park-area" })
                }
              />

              {/* features that belong to park area */}
              {/* these features might not be publishable */}
              {parkArea.features
                .filter((f) =>
                  featureTypeFilter(
                    f.featureType.strapiFeatureTypeId,
                    featureTypeId,
                  ),
                )
                .map((parkFeature) => (
                  <React.Fragment key={parkFeature.id}>
                    <tr className="table-row--park-area-feature">
                      <th scope="colgroup" colSpan="3">
                        {parkFeature.name}
                      </th>
                    </tr>
                    <DateTypeTableRow
                      groupedDateRanges={parkFeature.groupedDateRanges}
                      currentYear={regularSeason.operatingYear || null}
                    />
                    <DateTableRow
                      groupedDateRanges={parkFeature.groupedDateRanges}
                      currentYear={regularSeason.operatingYear || null}
                    />
                  </React.Fragment>
                ))}
            </React.Fragment>
          )
        );
      })}
    </>
  );
}

FeaturesByFeatureTypeWithAreas.propTypes = {
  featureTypeId: PropTypes.number.isRequired,
  park: PropTypes.object.isRequired,
  parkAreas: PropTypes.array.isRequired,
  inReservationSystemFilter: PropTypes.bool.isRequired,
  formPanelHandler: PropTypes.func.isRequired,
  featureTypeFilter: PropTypes.func.isRequired,
};

function FeaturesByFeatureTypeNoAreas({
  park,
  features,
  inReservationSystemFilter,
  formPanelHandler,
}) {
  return (
    <>
      {/* features that don't belong to park area  */}
      {features.map((feature) => {
        // filter out features not in reservation system if the filter is applied
        if (inReservationSystemFilter && !feature.inReservationSystem) {
          return null;
        }

        const regularSeason = feature.currentSeason.regular;

        return (
          <React.Fragment key={feature.id}>
            <StatusTableRow
              id={feature.id}
              level="feature"
              name={`${park.name} - ${feature.name}`}
              typeName={feature.featureType.name}
              season={regularSeason}
              formPanelHandler={() =>
                formPanelHandler({ ...feature, level: "feature" })
              }
            />
            <DateTypeTableRow
              groupedDateRanges={feature.groupedDateRanges}
              currentYear={regularSeason.operatingYear || null}
            />
            <DateTableRow
              groupedDateRanges={feature.groupedDateRanges}
              currentYear={regularSeason.operatingYear || null}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

FeaturesByFeatureTypeNoAreas.propTypes = {
  park: PropTypes.object.isRequired,
  features: PropTypes.array.isRequired,
  inReservationSystemFilter: PropTypes.bool.isRequired,
  formPanelHandler: PropTypes.func.isRequired,
};

function Table({ park, formPanelHandler, inReservationSystemFilter }) {
  // Constants
  const parkAreas = park.parkAreas || [];
  const features = park.features || [];
  const regularSeason = park.currentSeason.regular;
  const winterSeason = park?.currentSeason.winter || {};
  const isParkInReservationSystem =
    park.hasTier1Dates || park.hasTier2Dates || park.hasWinterFeeDates;

  // Filter function to determine if feature matches current feature type group
  function matchesFeatureTypeGroup(featureTypeId, groupFeatureType) {
    return groupFeatureType === FEATURE_TYPE.UNKNOWN
      ? !FEATURE_TYPE.SORT_ORDER.includes(featureTypeId)
      : featureTypeId === groupFeatureType;
  }

  // Don't render table if park is filtered out
  if (inReservationSystemFilter && !isParkInReservationSystem) {
    return null;
  }

  return (
    <table key={park.id} className="table has-header-row mb-0">
      <thead>
        <tr className="table-row--park-header">
          <th
            scope="col"
            colSpan="3"
            className="align-middle fw-normal text-white"
          >
            {park.name}
          </th>
        </tr>
      </thead>

      <tbody>
        {/* If the park isn't filtered out, show its Park-level dates */}
        {park.matchesFilters !== false && (
          <>
            {/* park level - regular season dates (park gate, tier 1, tier 2) */}
            <StatusTableRow
              level="park"
              name="Tiers and gate"
              season={regularSeason}
              formPanelHandler={() =>
                formPanelHandler({
                  ...park,
                  level: "park",
                  isWinterSeason: false,
                })
              }
            />
            <DateTypeTableRow
              groupedDateRanges={park.groupedDateRanges}
              currentYear={regularSeason.operatingYear}
            />
            <DateTableRow
              groupedDateRanges={park.groupedDateRanges}
              currentYear={regularSeason.operatingYear}
            />

            {/* park level - winter fee season */}
            {park.hasWinterFeeDates && (
              <>
                <StatusTableRow
                  level="park"
                  name="Winter fee"
                  season={winterSeason}
                  formPanelHandler={() =>
                    formPanelHandler({
                      ...park,
                      level: "park",
                      isWinterSeason: true,
                    })
                  }
                />
                <DateTypeTableRow
                  groupedDateRanges={park.winterGroupedDateRanges}
                  currentYear={winterSeason.operatingYear || null}
                  isWinterSeason={true}
                />
                <DateTableRow
                  groupedDateRanges={park.groupedDateRanges}
                  currentYear={regularSeason.operatingYear}
                />
              </>
            )}
          </>
        )}

        {FEATURE_TYPE.SORT_ORDER.map((featureTypeId) => (
          <React.Fragment key={`feature-type-${featureTypeId}`}>
            <FeaturesByFeatureTypeWithAreas
              featureTypeId={featureTypeId}
              park={park}
              parkAreas={parkAreas}
              inReservationSystemFilter={inReservationSystemFilter}
              formPanelHandler={formPanelHandler}
              featureTypeFilter={matchesFeatureTypeGroup}
            />
            <FeaturesByFeatureTypeNoAreas
              park={park}
              features={features.filter((f) =>
                matchesFeatureTypeGroup(
                  f.featureType.strapiFeatureTypeId,
                  featureTypeId,
                ),
              )}
              inReservationSystemFilter={inReservationSystemFilter}
              formPanelHandler={formPanelHandler}
            />
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

Table.propTypes = {
  park: PropTypes.shape({
    id: PropTypes.number.isRequired,
    matchesFilters: PropTypes.bool,
    name: PropTypes.string.isRequired,
    currentSeason: PropTypes.shape({
      regular: PropTypes.object,
      winter: PropTypes.object,
    }),
    groupedDateRanges: PropTypes.object,
    winterGroupedDateRanges: PropTypes.object,
    hasTier1Dates: PropTypes.bool,
    hasTier2Dates: PropTypes.bool,
    hasWinterFeeDates: PropTypes.bool,
    parkAreas: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        currentSeason: PropTypes.shape({
          regular: PropTypes.object,
        }),
        groupedDateRanges: PropTypes.object,
        inReservationSystem: PropTypes.bool,
        featureType: PropTypes.shape({
          name: PropTypes.string,
        }),
        features: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            currentSeason: PropTypes.shape({
              regular: PropTypes.object,
            }),
            groupedDateRanges: PropTypes.object,
          }),
        ),
      }),
    ),
    features: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        currentSeason: PropTypes.shape({
          regular: PropTypes.object,
        }),
        groupedDateRanges: PropTypes.object,
        inReservationSystem: PropTypes.bool,
        featureType: PropTypes.shape({
          name: PropTypes.string.isRequired,
        }),
      }),
    ),
  }),
  formPanelHandler: PropTypes.func.isRequired,
  inReservationSystemFilter: PropTypes.bool,
};

export default function EditAndReviewTable({
  data,
  filters,
  onResetFilters,
  formPanelHandler,
}) {
  const { isInReservationSystem } = filters;

  return (
    <div className="table-responsive">
      {data.map((park) => (
        <Table
          key={park.id}
          park={park}
          formPanelHandler={formPanelHandler}
          inReservationSystemFilter={isInReservationSystem}
        />
      ))}

      {data.length === 0 && (
        <div className="text-center">
          <p>No records match your filters. </p>
          <p>
            <button onClick={onResetFilters} className="btn btn-primary">
              Reset filters to show all records
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

// Define prop types for EditAndReviewTable
EditAndReviewTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      status: PropTypes.string,
    }),
  ),
  filters: PropTypes.object,
  onResetFilters: PropTypes.func,
  formPanelHandler: PropTypes.func,
};
