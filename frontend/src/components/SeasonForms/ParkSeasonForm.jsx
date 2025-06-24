import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { groupBy, set as lodashSet, cloneDeep } from "lodash-es";
import { useMemo, useContext } from "react";
import DateRangeFields from "@/components/DateRangeFields";
import PropTypes from "prop-types";
import TooltipWrapper from "@/components/TooltipWrapper";

import FormContainer from "@/components/FormContainer";
import GateForm from "@/components/GateForm";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";

import useAccess from "@/hooks/useAccess";
import DataContext from "@/contexts/DataContext";

export default function ParkSeasonForm({ season, previousSeasonDates }) {
  // @TODO: make this a prop again
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  const { setData, addDeletedDateRangeId } = useContext(DataContext);

  const park = season.park;
  const currentYear = season.operatingYear;
  const lastYear = currentYear - 1;

  // Order of date types to display on the form
  // @TODO: get this from the db in the season endpoint
  const dateTypes = [
    {
      displayName: "Tier 1",
      tooltipText: "@TODO: tooltip text",
      dbName: "Tier 1",
      name: "Tier 1",
      id: 11,
    },

    {
      displayName: "Tier 2",
      tooltipText: "@TODO: tooltip text",
      dbName: "Tier 2",
      name: "Tier 2",
      id: 12,
    },

    {
      displayName: "Winter",
      tooltipText: "@TODO: tooltip text",
      dbName: "Winter fee",
      name: "Winter fee",
      id: 13,
    },
  ];

  const datesByType = useMemo(
    () => groupBy(park.dateable.dateRanges, "dateType.name"),
    [park.dateable.dateRanges],
  );

  const previousDatesByType = useMemo(
    () => groupBy(previousSeasonDates.dateRanges, "dateType.name"),
    [previousSeasonDates.dateRanges],
  );

  // Updates the date range in the parent component
  function updateDateRange(id, dateField, dateObj, tempId = false) {
    console.log(
      "\n\nupdateDateRange called with:",
      id,
      dateField,
      dateObj,
      tempId,
    );

    const { dateRanges } = season.park.dateable;
    // Find the dateRanges array index from the dateRange id or tempId
    const dateRangeIndex = dateRanges.findIndex((range) => {
      if (tempId) {
        return range.tempId === id;
      }

      return range.id === id;
    });

    // Path to update to the DateRange object
    const dateRangePath = [
      "current",
      "park",
      "dateable",
      "dateRanges",
      dateRangeIndex,
    ];

    // Update the local state (in the FormPanel component)
    setData((prevData) => {
      let updatedData = cloneDeep(prevData);

      // Update the start or end date field
      updatedData = lodashSet(
        updatedData,
        [...dateRangePath, dateField],
        dateObj,
      );

      // Update the changed flag for the date range
      return lodashSet(updatedData, [...dateRangePath, "changed"], true);
    });
  }

  // Adds a new date range to the park's dateable.dateRanges
  function addDateRange(dateType) {
    const newDateRange = {
      // Add a temporary ID for records that haven't been saved yet
      tempId: crypto.randomUUID(),
      startDate: null,
      endDate: null,
      dateableId: park.dateable.id,
      dateType,
      changed: true,
    };

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.current.park.dateable.dateRanges.push(newDateRange);
      return updatedData;
    });
  }

  // Removes a date range from the park's dateable.dateRanges by its ID or tempId
  function removeDateRange(dateRange) {
    // Track deleted date range IDs
    if (dateRange.id) {
      addDeletedDateRangeId(dateRange.id);
    }

    console.log("removeDateRange called", dateRange);
    setData((prevData) => {
      const updatedData = cloneDeep(prevData);
      const { dateRanges } = updatedData.current.park.dateable;

      const index = dateRanges.findIndex((range) => {
        // Find by ID if dateRange has one
        if (dateRange.id) {
          return dateRange.id === range.id;
        }

        // Otherwise, find by tempId
        if (dateRange.tempId) {
          return dateRange.tempId === range.tempId;
        }

        return false;
      });

      if (index !== -1) {
        dateRanges.splice(index, 1);
      }

      return updatedData;
    });
  }

  // Updates the readyToPublish state in the season data object
  function setReadyToPublish(value) {
    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.current.readyToPublish = value;

      return updatedData;
    });
  }

  return (
    <>
      <FormContainer>
        <div className="row mb-4">
          {dateTypes.map((dateType) => (
            <div key={dateType.dbName} className="col-lg-6">
              <h6 className="fw-normal">
                {dateType.displayName}{" "}
                <TooltipWrapper placement="top" content={dateType.tooltipText}>
                  <FontAwesomeIcon icon={faCircleInfo} />
                </TooltipWrapper>
              </h6>
              {/* TODO: previous dates from previousSeasonDates */}
              <p>Previous dates are not provided</p>
              <DateRangeFields
                dateableId={park.dateableId}
                dateType={dateType}
                dateRanges={datesByType[dateType.dbName] ?? []}
                updateDateRange={updateDateRange}
                addDateRange={addDateRange}
                removeDateRange={removeDateRange}
              />
            </div>
          ))}
        </div>
      </FormContainer>

      <GateForm
        gateTitle="Park gate"
        gateDescription='Does this park have a single gated vehicle entrance? If there are
              multiple vehicle entrances, select "No".'
        // hasGate={park.hasGate} @TODO: get this from the db
        setHasGate={
          (value) => console.log("TODO: setHasGate", value)
          // setPark({ ...park, hasGate: value })
        }
        // @TODO: groupedDateRanges - just pass in the dateable?
        // dateRanges={park.groupedDateRanges}
        level={"park"}
        currentYear={currentYear}
        lastYear={lastYear}
      />

      {/* TODO: add Ready to Publish for approver */}
      {approver && (
        <ReadyToPublishBox
          readyToPublish={season.readyToPublish}
          setReadyToPublish={setReadyToPublish}
        />
      )}
    </>
  );
}

// PropTypes validation
ParkSeasonForm.propTypes = {
  season: PropTypes.shape({
    park: PropTypes.object.isRequired,
    operatingYear: PropTypes.number.isRequired,
    readyToPublish: PropTypes.bool.isRequired,
  }).isRequired,
  previousSeasonDates: PropTypes.shape({
    dateRanges: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};
