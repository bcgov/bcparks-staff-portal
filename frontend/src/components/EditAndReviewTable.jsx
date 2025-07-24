import React, { useMemo, useContext } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { faCheck } from "@fa-kit/icons/classic/solid";
import { faPen } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatusBadge from "@/components/StatusBadge";
import NotReadyFlag from "@/components/NotReadyFlag";
import TooltipWrapper from "@/components/TooltipWrapper";
import { formatDateRange } from "@/lib/utils";
import useAccess from "@/hooks/useAccess";
import { useApiPost } from "@/hooks/useApi";
import RefreshTableContext from "@/contexts/RefreshTableContext";
import globalFlashMessageContext from "@/contexts/FlashMessageContext";
import "./EditAndReviewTable.scss";

// Constants
const currentYear = new Date().getFullYear();
const lastYear = currentYear - 1;

// Components
function IconButton({ icon, label, onClick, textColor, loading = false }) {
  return (
    <button
      onClick={onClick}
      className={classNames("btn btn-text text-link", textColor)}
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
      {dateRanges.map((dateRange) => (
        <li key={dateRange.id}>
          {formatDateRange(dateRange)}
          <TooltipWrapper
            placement="top"
            content="Dates not ready to be made public"
          >
            <NotReadyFlag show={!dateRange.readyToPublish} />
          </TooltipWrapper>
        </li>
      ))}
    </ul>
  );
}

DateRangesList.propTypes = {
  dateRanges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      startDate: PropTypes.instanceOf(Date).isRequired,
      endDate: PropTypes.instanceOf(Date).isRequired,
      readyToPublish: PropTypes.bool.isRequired,
    }),
  ),
  isLastYear: PropTypes.bool,
};

function DateTypeTableRow({ groupedDateRanges }) {
  if (!groupedDateRanges || Object.keys(groupedDateRanges).length === 0)
    return null;
  return (
    <tr className="table-row--date-type">
      <th scope="col">Type of date</th>
      <th scope="col">{lastYear}</th>
      <th scope="col">{currentYear}</th>
    </tr>
  );
}

DateTypeTableRow.propTypes = {
  groupedDateRanges: PropTypes.object,
};

function DateTableRow({ groupedDateRanges }) {
  if (!groupedDateRanges) return null;
  return Object.entries(groupedDateRanges).map(([dateTypeName, yearsObj]) => (
    <tr key={dateTypeName} className="table-row--date">
      <td className="fw-bold">{dateTypeName}</td>
      <td>
        <DateRangesList dateRanges={yearsObj[lastYear]} isLastYear={true} />
      </td>
      <td>
        <DateRangesList dateRanges={yearsObj[currentYear]} />
      </td>
    </tr>
  ));
}

DateTableRow.propTypes = {
  groupedDateRanges: PropTypes.object,
};

function ApproveButton({ seasonId, color = "", onApprove }) {
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
    />
  );
}

ApproveButton.propTypes = {
  seasonId: PropTypes.number.isRequired,
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
    <tr key={id} className={classNames(level && `table-row--${level}`)}>
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

function Table({ park, formPanelHandler }) {
  // Constants
  const parkAreas = park.parkAreas || [];
  const features = park.features || [];

  return (
    <table key={park.id} className="table has-header-row mb-0">
      <thead>
        <StatusTableRow
          level="park"
          nameCellClass="fw-normal text-white"
          name={park.name}
          season={park.currentSeason}
          formPanelHandler={() => formPanelHandler({ ...park, level: "park" })}
          color="text-white"
        />
      </thead>

      <tbody>
        {/* 1 - park level */}
        <DateTypeTableRow groupedDateRanges={park.groupedDateRanges} />
        <DateTableRow groupedDateRanges={park.groupedDateRanges} />

        {/* 2 - park area level */}
        {parkAreas.map((parkArea) => (
          <React.Fragment key={parkArea.id}>
            <StatusTableRow
              id={parkArea.id}
              level="park-area"
              name={`${park.name} - ${parkArea.name}`}
              typeName={parkArea.featureType?.name}
              season={parkArea.currentSeason}
              formPanelHandler={() =>
                formPanelHandler({ ...parkArea, level: "park-area" })
              }
            />

            {/* features that belong to park area */}
            {/* these features might not be publishable */}
            {parkArea.features.map((parkFeature) => (
              <React.Fragment key={parkFeature.id}>
                <tr className="table-row--park-area-feature">
                  <th scope="colgroup" colSpan="3">
                    {parkFeature.name}
                  </th>
                </tr>
                <DateTypeTableRow
                  groupedDateRanges={parkFeature.groupedDateRanges}
                />
                <DateTableRow
                  groupedDateRanges={parkFeature.groupedDateRanges}
                />
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}

        {/* 3 - feature level */}
        {/* features that don't belong to park area  */}
        {/* these features are publishable */}
        {features.map((feature) => (
          <React.Fragment key={feature.id}>
            <StatusTableRow
              id={feature.id}
              level="feature"
              name={`${park.name} - ${feature.name}`}
              typeName={feature.featureType.name}
              season={feature.currentSeason}
              formPanelHandler={() =>
                formPanelHandler({ ...feature, level: "feature" })
              }
            />
            <DateTypeTableRow groupedDateRanges={feature.groupedDateRanges} />
            <DateTableRow groupedDateRanges={feature.groupedDateRanges} />
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

Table.propTypes = {
  park: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    currentSeason: PropTypes.shape({
      status: PropTypes.string,
    }),
    groupedDateRanges: PropTypes.object,
    parkAreas: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        currentSeason: PropTypes.shape({
          status: PropTypes.string,
        }),
        groupedDateRanges: PropTypes.object,
        featureType: PropTypes.shape({
          name: PropTypes.string,
        }),
        features: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.number.isRequired,
            name: PropTypes.string.isRequired,
            currentSeason: PropTypes.shape({
              status: PropTypes.string,
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
          status: PropTypes.string,
        }),
        groupedDateRanges: PropTypes.object,
        featureType: PropTypes.shape({
          name: PropTypes.string.isRequired,
        }),
      }),
    ),
  }),
  formPanelHandler: PropTypes.func.isRequired,
};

export default function EditAndReviewTable({
  data,
  onResetFilters,
  formPanelHandler,
}) {
  return (
    <div className="table-responsive">
      {data.map((park) => (
        <Table key={park.id} park={park} formPanelHandler={formPanelHandler} />
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
  onResetFilters: PropTypes.func,
  formPanelHandler: PropTypes.func,
};
