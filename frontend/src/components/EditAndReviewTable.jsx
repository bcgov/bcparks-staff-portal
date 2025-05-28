import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { faCheck } from "@fa-kit/icons/classic/solid";
import { faPen } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatusBadge from "@/components/StatusBadge";
// TODO: add it to DateRangesList once status is implemented
// import NotReadyFlag from "@/components/NotReadyFlag";
import { formatDateShort } from "@/lib/utils";
import "./EditAndReviewTable.scss";

// Constants
const currentYear = new Date().getFullYear();
const lastYear = currentYear - 1;

// Functions
// formats a single date range
// e.g. startDate – endDate => Mon, 1 Jan – Tue, 31 Dec
function formattedDateRange(startDate, endDate) {
  if (!startDate || !endDate) return null;
  return (
    <>
      {formatDateShort(startDate)} &ndash; {formatDateShort(endDate)}
    </>
  );
}

// Components
function IconButton({ icon, label, onClick, textColor }) {
  return (
    <button
      onClick={onClick}
      className={classNames("btn btn-text text-link", textColor)}
    >
      <FontAwesomeIcon icon={icon} />
      <span className="ms-1">{label}</span>
    </button>
  );
}

IconButton.propTypes = {
  icon: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  textColor: PropTypes.string,
};

// renders all date ranges for a given year as a list
// e.g. [{ startDate: "Mon Jan 1", endDate: "Tue Jan 2" }, { startDate: "Mon Dec 30", endDate: "Tue Dec 31" }]
// => Mon, 1 Jan – Tue, 2 Jan / Mon, 30 Dec – Tue, 31 Dec
function DateRangesList({ year }) {
  if (!year || year.length === 0) return null;
  return (
    <ul className="list-unstyled mb-0">
      {year.map((dateRange) => (
        <li key={dateRange.id}>
          {formattedDateRange(dateRange.startDate, dateRange.endDate)}
        </li>
      ))}
    </ul>
  );
}

DateRangesList.propTypes = {
  year: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      startDate: PropTypes.instanceOf(Date).isRequired,
      endDate: PropTypes.instanceOf(Date).isRequired,
    }),
  ),
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
        <DateRangesList year={yearsObj[lastYear]} />
      </td>
      <td>
        <DateRangesList year={yearsObj[currentYear]} />
      </td>
    </tr>
  ));
}

DateTableRow.propTypes = {
  groupedDateRanges: PropTypes.object,
};

function StatusTableRow({
  id,
  level,
  nameCellClass,
  name,
  typeName,
  status,
  color,
}) {
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
      <th scope="col" className="align-middle text-end">
        <StatusBadge status={status} />
        <IconButton icon={faPen} label="Edit" textColor={color} />
        <IconButton icon={faCheck} label="Approve" textColor={color} />
      </th>
    </tr>
  );
}

StatusTableRow.propTypes = {
  id: PropTypes.number,
  level: PropTypes.string,
  nameCellClass: PropTypes.string,
  name: PropTypes.string.isRequired,
  typeName: PropTypes.string,
  status: PropTypes.string.isRequired,
  color: PropTypes.string,
};

function Table(park) {
  // Constants
  const parkAreas = park.parkAreas || [];
  const features = park.features || [];

  // TODO: replace dummy data with real data
  // dummy data for park
  const parkGroupedDateRanges = {
    Operation: {
      2024: [
        {
          id: 1,
          startDate: new Date("2024-05-15T00:00:00.000Z"),
          endDate: new Date("2024-10-15T00:00:00.000Z"),
        },
      ],
      2025: [
        {
          id: 2,
          startDate: new Date("2025-11-15T00:00:00.000Z"),
          endDate: new Date("2025-12-15T00:00:00.000Z"),
        },
      ],
    },
    Tier1: {
      2024: [
        {
          id: 3,
          startDate: new Date("2024-05-15T00:00:00.000Z"),
          endDate: new Date("2024-10-15T00:00:00.000Z"),
        },
      ],
      2025: [],
    },
  };

  return (
    <table key={park.id} className="table has-header-row mb-0">
      <thead>
        <StatusTableRow
          level="park"
          nameCellClass="fw-normal text-white"
          name={park.name}
          status={park.status}
          color="text-white"
        />
      </thead>

      <tbody>
        {/* 1 - park level */}
        {/* TODO: replace dummy data with real data */}
        <DateTypeTableRow groupedDateRanges={parkGroupedDateRanges} />
        <DateTableRow groupedDateRanges={parkGroupedDateRanges} />

        {/* 2 - park area level */}
        {parkAreas.length > 0 &&
          parkAreas.map((parkArea) => (
            <React.Fragment key={parkArea.id}>
              {/* TODO: replace dummy status */}
              <StatusTableRow
                id={parkArea.id}
                level="park-area"
                name={`${park.name} - ${parkArea.name}`}
                status={park.status}
              />
              <DateTypeTableRow
                groupedDateRanges={parkAreas.groupedDateRanges}
              />

              {/* features that belong to park area */}
              {parkArea.features.length > 0 &&
                parkArea.features.map((parkFeature) => (
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
        {features.length > 0 &&
          features
            .filter((feature) => !feature.parkAreaId)
            .map((feature) => (
              <React.Fragment key={feature.id}>
                {/* TODO: replace dummy status */}
                <StatusTableRow
                  id={feature.id}
                  level="feature"
                  name={`${park.name} - ${feature.name}`}
                  typeName={feature.featureType.name}
                  status={park.status}
                />
                <DateTypeTableRow
                  groupedDateRanges={feature.groupedDateRanges}
                />
                <DateTableRow groupedDateRanges={feature.groupedDateRanges} />
              </React.Fragment>
            ))}
      </tbody>
    </table>
  );
}

Table.propTypes = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  parkAreas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      features: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          groupedDateRanges: PropTypes.object,
        }),
      ),
    }),
  ),
  features: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      featureType: PropTypes.shape({
        name: PropTypes.string.isRequired,
      }),
      groupedDateRanges: PropTypes.object,
    }),
  ),
};

export default function EditAndReviewTable({ data, onResetFilters }) {
  return (
    <div className="table-responsive">
      {data.map((park) => (
        <Table key={park.id} {...park} />
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
};
