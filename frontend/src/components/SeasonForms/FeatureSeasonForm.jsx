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

export default function FeatureSeasonForm({ season, previousSeasonDates }) {
  // @TODO: make this a prop again
  const { ROLES, checkAccess } = useAccess();
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  const feature = season.feature;
  const currentYear = season.operatingYear;
  const lastYear = currentYear - 1;

  return (
    <>
      <FormContainer>
        <h5>{feature.name}</h5>
        <div>@TODO: feature season dates</div>
        {/* {current.groupedDateRanges && (
          <DateRangeForm
            dateRanges={current.groupedDateRanges}
            seasons={data}
            currentYear={currentYear}
            lastYear={lastYear}
          />
        )} */}
      </FormContainer>

      <GateForm
        gateTitle={`${feature.name} gate`}
        gateDescription={`Does ${feature.name} have a gated entrance?`}
        // hasGate={park.hasGate} @TODO: get this from the db
        setHasGate={
          (value) => console.log("TODO: setHasGate", value)
          // setPark({ ...park, hasGate: value })
        } // @TODO: groupedDateRanges - just pass in the dateable?
        // dateRanges={park.groupedDateRanges}
        level={"feature"}
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
