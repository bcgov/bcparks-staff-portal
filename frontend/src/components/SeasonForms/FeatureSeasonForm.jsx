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
import { updateDateRangeAnnualsArray } from "@/lib/utils";
import isDateTypeOptional from "@/lib/isDateTypeOptional";

export default function FeatureSeasonForm({
  season,
  previousSeasonDates,
  dateTypes,
  approver,
}) {
  const { setData, addDeletedDateRangeId } = useContext(DataContext);

  const feature = season.feature;
  const dateRangeAnnuals = season.dateRangeAnnuals || [];
  const gateDetail = season.gateDetail || {};

  // Show the date form sections only if there are applicable date types for this feature.
  // If there are no date types to show, the section would be empty, so we won't render it.
  const showDateFormSections = useMemo(
    () => dateTypes.length > 0,
    [dateTypes.length],
  );

  const datesByType = useMemo(
    () => groupBy(feature.dateable.dateRanges, "dateType.name"),
    [feature.dateable.dateRanges],
  );

  const previousDatesByType = useMemo(
    () => groupBy(previousSeasonDates, "dateType.name"),
    [previousSeasonDates],
  );

  // Updates the date range in the parent component
  function updateDateRange(id, dateField, dateObj, tempId = false) {
    const { dateRanges } = season.feature.dateable;
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
      "feature",
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

  // Adds a new date range to the Feature's dateable.dateRanges
  function addDateRange(dateType) {
    const newDateRange = {
      // Add a temporary ID for records that haven't been saved yet
      tempId: crypto.randomUUID(),
      startDate: null,
      endDate: null,
      dateableId: feature.dateable.id,
      dateType,
      dateTypeId: dateType.id,
      changed: true,
    };

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.current.feature.dateable.dateRanges.push(newDateRange);
      return updatedData;
    });
  }

  // Removes a date range from the Feature's dateable.dateRanges by its ID or tempId
  function removeDateRange(dateRange) {
    // Track deleted date range IDs
    if (dateRange.id) {
      addDeletedDateRangeId(dateRange.id);
    }

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);
      const { dateRanges } = updatedData.current.feature.dateable;

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

      updatedData.current.dateRangeAnnuals = updateDateRangeAnnualsArray(
        updatedData.current.dateRangeAnnuals,
        updatedAnnual,
      );
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

  // Individual Feature form section
  function FormSection() {
    return (
      <div className="row">
        {dateTypes.map((dateType) => (
          <div key={dateType.name} className="col-lg-6 mb-4">
            <h6 className="fw-normal">
              {dateType.name}{" "}
              <TooltipWrapper placement="top" content={dateType.description}>
                <FontAwesomeIcon icon={faCircleInfo} />
              </TooltipWrapper>
            </h6>

            {isDateTypeOptional(dateType.name, "feature") && (
              <div className="my-2 text-secondary-grey">(Optional)</div>
            )}

            <PreviousDates dateRanges={previousDatesByType?.[dateType.name]} />

            <DateRangeFields
              dateableId={feature.dateableId}
              dateType={dateType}
              dateRanges={datesByType[dateType.name] ?? []}
              updateDateRange={updateDateRange}
              addDateRange={addDateRange}
              removeDateRange={removeDateRange}
              dateRangeAnnuals={dateRangeAnnuals}
              updateDateRangeAnnual={updateDateRangeAnnual}
              optional={isDateTypeOptional(dateType.name, "feature")}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {showDateFormSections &&
        (feature.inReservationSystem ? (
          <FormContainer>
            <FormSection />
          </FormContainer>
        ) : (
          <div className="non-bcp-reservations">
            <FormSection />
          </div>
        ))}

      <GateForm
        gateTitle={`${feature.name} gate`}
        gateDescription={`Does ${feature.name} have a gated entrance?`}
        gateDetail={gateDetail}
        updateGateDetail={updateGateDetail}
        level={"feature"}
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
FeatureSeasonForm.propTypes = {
  season: PropTypes.shape({
    feature: PropTypes.object.isRequired,
    operatingYear: PropTypes.number.isRequired,
    readyToPublish: PropTypes.bool.isRequired,
    dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
    gateDetail: PropTypes.shape({
      hasGate: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf([null])]),
      gateOpenTime: PropTypes.string,
      gateCloseTime: PropTypes.string,
      gateOpensAtDawn: PropTypes.bool,
      gateClosesAtDusk: PropTypes.bool,
      gateOpen24Hours: PropTypes.bool,
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
