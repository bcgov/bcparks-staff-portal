import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { groupBy, set as lodashSet, cloneDeep } from "lodash-es";
import { useMemo, useContext } from "react";
import PropTypes from "prop-types";

import DateRangeFields from "@/components/DateRangeFields";
import FormContainer from "@/components/FormContainer";
import GateForm from "@/components/GateForm";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import TooltipWrapper from "@/components/TooltipWrapper";
import PreviousDates from "@/components/SeasonForms/PreviousDates";

import DataContext from "@/contexts/DataContext";

export default function ParkSeasonForm({
  season,
  previousSeasonDates,
  dateTypes,
  approver,
}) {
  const { setData, addDeletedDateRangeId } = useContext(DataContext);

  const park = season.park;
  const dateRangeAnnuals = season.dateRangeAnnuals || [];
  const gateDetail = season.gateDetail || {};

  const operatingDateType = dateTypes.find(
    (dateType) => dateType.name === "Operating",
  );

  const datesByType = useMemo(
    () => groupBy(park.dateable.dateRanges, "dateType.name"),
    [park.dateable.dateRanges],
  );

  const previousDatesByType = useMemo(
    () => groupBy(previousSeasonDates, "dateType.name"),
    [previousSeasonDates],
  );

  // Updates the date range in the parent component
  function updateDateRange(id, dateField, dateObj, tempId = false) {
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

  // Adds a new date range to the Park's dateable.dateRanges
  function addDateRange(dateType) {
    const newDateRange = {
      // Add a temporary ID for records that haven't been saved yet
      tempId: crypto.randomUUID(),
      startDate: null,
      endDate: null,
      dateableId: park.dateable.id,
      dateType,
      dateTypeId: dateType.id,
      changed: true,
    };

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.current.park.dateable.dateRanges.push(newDateRange);
      return updatedData;
    });
  }

  // Removes a date range from the Park's dateable.dateRanges by its ID or tempId
  function removeDateRange(dateRange) {
    // Track deleted date range IDs
    if (dateRange.id) {
      addDeletedDateRangeId(dateRange.id);
    }

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

  // Updates the isDateRangeAnnual state in the season data object
  function updateDateRangeAnnual(updatedAnnual) {
    setData((prevData) => {
      const updatedData = cloneDeep(prevData);
      const annuals = updatedData.current.dateRangeAnnuals;
      const index = annuals.findIndex(
        (annual) => annual.id === updatedAnnual.id,
      );

      if (index !== -1) {
        annuals[index] = { ...annuals[index], ...updatedAnnual, changed: true };
      }
      return updatedData;
    });
  }

  // Updates the gateDetail state in the season data object
  function updateGateDetail(updatedGateDetail) {
    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.current.gateDetail = {
        ...updatedData.current.gateDetail,
        ...updatedGateDetail,
      };
      return updatedData;
    });
  }

  return (
    <>
      <FormContainer>
        <div className="row">
          {dateTypes.map((dateType) => (
            <div key={dateType.name} className="col-lg-6 mb-4">
              <h6 className="fw-normal">
                {dateType.name}{" "}
                <TooltipWrapper placement="top" content={dateType.description}>
                  <FontAwesomeIcon icon={faCircleInfo} />
                </TooltipWrapper>
              </h6>

              <PreviousDates
                dateRanges={previousDatesByType?.[dateType.name]}
              />

              <DateRangeFields
                dateableId={park.dateableId}
                dateType={dateType}
                dateRanges={datesByType[dateType.name] ?? []}
                updateDateRange={updateDateRange}
                addDateRange={addDateRange}
                removeDateRange={removeDateRange}
                dateRangeAnnuals={dateRangeAnnuals}
                updateDateRangeAnnual={updateDateRangeAnnual}
              />
            </div>
          ))}
        </div>
      </FormContainer>

      <GateForm
        gateTitle="Park gate"
        gateDescription='Does this park have a single gated vehicle entrance? If there are
              multiple vehicle entrances, select "No".'
        gateDetail={gateDetail}
        updateGateDetail={updateGateDetail}
        dateableId={park.dateableId}
        dateType={operatingDateType}
        dateRanges={datesByType.Operating ?? []}
        updateDateRange={updateDateRange}
        addDateRange={addDateRange}
        removeDateRange={removeDateRange}
        dateRangeAnnuals={dateRangeAnnuals}
        updateDateRangeAnnual={updateDateRangeAnnual}
        previousDateRanges={previousDatesByType?.Operating ?? []}
        level={"park"}
      />

      {/* Show Ready to Publish form input for approvers */}
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
    dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
    gateDetail: PropTypes.shape({
      hasGate: PropTypes.bool,
      gateOpenTime: PropTypes.string,
      gateCloseTime: PropTypes.string,
      gateOpensAtDawn: PropTypes.bool,
      gateClosesAtDusk: PropTypes.bool,
      gateOpen24Hours: PropTypes.bool,
      isTimeRangeAnnual: PropTypes.bool,
    }),
  }).isRequired,

  previousSeasonDates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
      dateType: PropTypes.shape({
        name: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
      }),
    }),
  ).isRequired,

  dateTypes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      description: PropTypes.string,
    }),
  ).isRequired,

  approver: PropTypes.bool.isRequired,
};
