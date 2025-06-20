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

export default function AreaSeasonForm({ season, previousSeasonDates }) {
  // @TODO: make this a prop again
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  const parkArea = season.parkArea;
  const currentYear = season.operatingYear;
  const lastYear = currentYear - 1;

  // @TODO: implement AreaSeasonForm
  return (
    <>
      <FormContainer>
        <div>@TODO: area and area-feature dates</div>
        {/* TODO: park area dates */}
        {/* {current.groupedDateRanges &&
          Object.keys(current.groupedDateRanges).length > 0 && (
            <DateRangeForm
              dateRanges={current.groupedDateRanges}
              seasons={data}
              currentYear={currentYear}
              lastYear={lastYear}
            />
          )} */}
        {/* TODO: feature dates in park area */}
        {/* {current.features.length > 0 &&
          current.features.map((parkAreaFeature) => (
            <div key={parkAreaFeature.id} className="mb-4">
              <h5>{parkAreaFeature.name}</h5>
              {parkAreaFeature.groupedDateRanges && (
                <DateRangeForm
                  dateRanges={parkAreaFeature.groupedDateRanges}
                  seasons={data}
                  currentYear={currentYear}
                  lastYear={lastYear}
                />
              )}
            </div>
          ))} */}
      </FormContainer>

      <GateForm
        gateTitle={`${parkArea.name} gate`}
        gateDescription={`Does ${parkArea.name} have a gated entrance?`}
        // hasGate={park.hasGate} @TODO: get this from the db
        setHasGate={
          (value) => console.log("TODO: setHasGate", value)
          // setPark({ ...park, hasGate: value })
        }
        // @TODO: groupedDateRanges - just pass in the dateable(s)?
        // dateRanges={park.groupedDateRanges}
        level={"park-area"}
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
