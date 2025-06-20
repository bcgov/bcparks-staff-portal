import { useMemo } from "react";
import TooltipWrapper from "@/components/TooltipWrapper";
import DateRangeFields from "@/components/DateRangeFields";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fa-kit/icons/classic/regular";

import FormContainer from "@/components/FormContainer";
import DateRangeForm from "@/components/DateRangeForm";
import GateForm from "@/components/GateForm";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";

import useAccess from "@/hooks/useAccess";

export default function ParkSeasonForm({ season }) {
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  const park = season.park;
  const currentYear = season.operatingYear;
  const lastYear = currentYear - 1;

  console.log("current year", currentYear, season.operatingYear);

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
              <p>Previous dates are not provided</p>
              <DateRangeFields />
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
