import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { groupBy } from "lodash-es";
import { useMemo } from "react";
import DateRangeFields from "@/components/DateRangeFields";
import PropTypes from "prop-types";
import TooltipWrapper from "@/components/TooltipWrapper";

import FormContainer from "@/components/FormContainer";
import GateForm from "@/components/GateForm";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";

import useAccess from "@/hooks/useAccess";

export default function ParkSeasonForm({ season, previousSeasonDates }) {
  // @TODO: make this a prop again
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  const park = season.park;
  const currentYear = season.operatingYear;
  const lastYear = currentYear - 1;

  // Order of date types to display on the form
  // @TODO: get this from the db
  const dateTypes = [
    {
      displayName: "Tier 1",
      tooltipText: "@TODO: tooltip text",
      dbName: "Tier 1",
    },

    {
      displayName: "Tier 2",
      tooltipText: "@TODO: tooltip text",
      dbName: "Tier 2",
    },

    {
      displayName: "Winter",
      tooltipText: "@TODO: tooltip text",
      dbName: "Winter fee",
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
  function updateDateRange(id, dateField, dateObj) {
    // @TODO: build the path to pass to lodash `set`
    // (find the index from the dateRange.id)
    console.log("updateDateRange", id, dateField, dateObj);
  }

  console.log("datesByType:", datesByType);
  console.log("previousDatesByType:", previousDatesByType);

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
                dateRanges={datesByType[dateType.dbName] ?? []}
                updateDateRange={updateDateRange}
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
          setReadyToPublish={(value) =>
            // setPark({ ...park, readyToPublish: value })
            console.log("TODO: setReadyToPublish", value)
          }
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
