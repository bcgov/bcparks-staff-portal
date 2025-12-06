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

export default function ParkSeasonForm({
  season,
  previousSeasonDates,
  winterSeason,
  previousWinterSeasonDates,
  // All date types, including "Park gate open" and "Winter fee" (which is shown separately)
  dateTypes: allDateTypes,
  approver,
}) {
  const { setData, addDeletedDateRangeId } = useContext(DataContext);

  const park = season.park;
  const dateRangeAnnuals = season.dateRangeAnnuals || [];
  const gateDetail = season.gateDetail || {};
  const isWinterSeason = season.seasonType === "winter";

  // Park gate open dates and Winter fee dates are shown in the different section,
  // so split "Park gate open" and "Winter fee" out of the dateTypes array.
  const [gateDateType, winterDateType, dateTypes] = useMemo(() => {
    const grouped = groupBy(allDateTypes, (dateType) => {
      if (dateType.strapiDateTypeId === 1) return "gate";
      if (dateType.strapiDateTypeId === 4) return "winter";
      return "regular";
    });

    return [
      grouped.gate?.[0] || null, // Park gate open date type (single object)
      grouped.winter?.[0] || null, // Winter fee date type (single object)
      grouped.regular || [], // All other date types (array)
    ];
  }, [allDateTypes]);

  // Show the date form sections only if there are applicable date types for this park.
  // If there are no date types to show, the section would be empty, so we won't render it.
  const showDateFormSections = useMemo(
    () => dateTypes.length > 0,
    [dateTypes.length],
  );

  // If this park is in the BCParks Reservations system,
  // wrap the date inputs with FormContainer.
  const useBcpReservationsSection = useMemo(() => {
    if (park.inReservationSystem) return true;

    // If inReservationSystem is false in the database,
    // fall back to checking for T1/T2 dates as a workaround for incomplete data.
    if (park.hasTier1Dates || park.hasTier2Dates) {
      return true;
    }

    return false;
  }, [
    park.inReservationSystem,
    park.hasTier1Dates,
    park.hasTier2Dates,
  ]);

  const datesByType = useMemo(
    () => groupBy(park.dateable.dateRanges, "dateType.name"),
    [park.dateable.dateRanges],
  );

  // Winter season dates by type
  const winterDatesByType = useMemo(() => {
    if (!winterSeason?.park?.dateable?.dateRanges) {
      return {};
    }
    return groupBy(winterSeason.park.dateable.dateRanges, "dateType.name");
  }, [winterSeason?.park?.dateable?.dateRanges]);
  const previousDatesByType = useMemo(
    () => groupBy(previousSeasonDates, "dateType.name"),
    [previousSeasonDates],
  );

  // Updates the date range in the parent component
  function updateDateRange(
    id,
    dateField,
    dateObj,
    tempId = false,
    seasonType = "regular",
  ) {
    const seasonData = seasonType === "winter" ? winterSeason : season;
    const { dateRanges } = seasonData.park.dateable;
    // Find the dateRanges array index from the dateRange id or tempId
    const dateRangeIndex = dateRanges.findIndex((range) => {
      if (tempId) {
        return range.tempId === id;
      }

      return range.id === id;
    });

    // Choose data path based on season type
    const seasonKey = seasonType === "winter" ? "currentWinter" : "current";

    // Path to update to the DateRange object
    const dateRangePath = [
      seasonKey,
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
  function addDateRange(dateType, seasonType = "regular") {
    const seasonData = seasonType === "winter" ? winterSeason : season;

    const newDateRange = {
      // Add a temporary ID for records that haven't been saved yet
      tempId: crypto.randomUUID(),
      startDate: null,
      endDate: null,
      dateableId: seasonData.park.dateable.id,
      dateType,
      dateTypeId: dateType.id,
      changed: true,
    };

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);
      const seasonKey = seasonType === "winter" ? "currentWinter" : "current";

      updatedData[seasonKey].park.dateable.dateRanges.push(newDateRange);
      return updatedData;
    });
  }

  // Removes a date range from the Park's dateable.dateRanges by its ID or tempId
  function removeDateRange(dateRange, seasonType = "regular") {
    // Track deleted date range IDs
    if (dateRange.id) {
      addDeletedDateRangeId(dateRange.id);
    }

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);
      const seasonKey = seasonType === "winter" ? "currentWinter" : "current";
      const { dateRanges } = updatedData[seasonKey].park.dateable;

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

  // Updates the readyToPublish state in the winter season data object
  function setWinterReadyToPublish(value) {
    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.currentWinter.readyToPublish = value;

      return updatedData;
    });
  }

  // Updates the isDateRangeAnnual state in the winter season data object
  function updateWinterDateRangeAnnual(updatedAnnual) {
    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.currentWinter.dateRangeAnnuals = updateDateRangeAnnualsArray(
        updatedData.currentWinter.dateRangeAnnuals || [],
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

  // Individual Park form section
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

            {isDateTypeOptional(dateType.strapiDateTypeId, "park") && (
              <div className="my-2 text-secondary-grey">(Optional)</div>
            )}

            <PreviousDates dateRanges={previousDatesByType?.[dateType.name]} />

            <DateRangeFields
              dateableId={park.dateableId}
              dateType={dateType}
              dateRanges={datesByType[dateType.name] ?? []}
              updateDateRange={updateDateRange}
              addDateRange={addDateRange}
              removeDateRange={removeDateRange}
              dateRangeAnnuals={dateRangeAnnuals}
              updateDateRangeAnnual={updateDateRangeAnnual}
              optional={isDateTypeOptional(dateType.strapiDateTypeId, "park")}
            />
          </div>
        ))}
      </div>
    );
  }

  // Winter Season form section
  function WinterFormSection() {
    return (
      <div className="row">
        <div key="Winter fee" className="col-lg-6 mb-4">
          <h6 className="fw-normal">
            Winter fee{" "}
            <TooltipWrapper
              placement="top"
              content={winterDateType.description}
            >
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>

          <PreviousDates dateRanges={previousWinterSeasonDates} />

          <DateRangeFields
            dateableId={winterSeason.park.dateableId}
            dateType={winterDateType}
            dateRanges={winterDatesByType["Winter fee"] ?? []}
            updateDateRange={(id, field, obj, tempId) =>
              updateDateRange(id, field, obj, tempId, "winter")
            }
            addDateRange={(dateType) => addDateRange(dateType, "winter")}
            removeDateRange={(range) => removeDateRange(range, "winter")}
            dateRangeAnnuals={winterSeason.dateRangeAnnuals || []}
            updateDateRangeAnnual={updateWinterDateRangeAnnual}
            optional={isDateTypeOptional("Winter fee", "park")}
          />
        </div>
        {approver && (
          <ReadyToPublishBox
            readyToPublish={winterSeason.readyToPublish}
            setReadyToPublish={setWinterReadyToPublish}
            seasonType="winter"
          />
        )}
      </div>
    );
  }

  return (
    <>
      {isWinterSeason ? (
        <FormContainer>
          <WinterFormSection />
        </FormContainer>
      ) : (
        <>
          {/* Tier 1 and Tier 2 dates */}
          {showDateFormSections && useBcpReservationsSection && (
            <FormContainer>
              <FormSection />
            </FormContainer>
          )}

          {/* Park gate open dates */}
          <GateForm
            gateTitle="Park gate"
            gateDescription="Does this park have a gate (or gates) that controls vehicle access to all or most of the park?"
            gateDetail={gateDetail}
            updateGateDetail={updateGateDetail}
            dateableId={park.dateableId}
            dateType={gateDateType}
            dateRanges={datesByType["Park gate open"] ?? []}
            updateDateRange={updateDateRange}
            addDateRange={addDateRange}
            removeDateRange={removeDateRange}
            dateRangeAnnuals={dateRangeAnnuals}
            updateDateRangeAnnual={updateDateRangeAnnual}
            previousDateRanges={previousDatesByType?.["Park gate open"] ?? []}
            level={"park"}
          />
        </>
      )}

      {/* ☃️ TODO: Put readyToPublish box outstide/inside for winter season? */}
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
    seasonType: PropTypes.string.isRequired,
    dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
    gateDetail: PropTypes.shape({
      hasGate: PropTypes.oneOf([true, false, null]),
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
        strapiDateTypeId: PropTypes.number.isRequired,
      }),
    }),
  ).isRequired,

  winterSeason: PropTypes.shape({
    park: PropTypes.object.isRequired,
    operatingYear: PropTypes.number.isRequired,
    readyToPublish: PropTypes.bool.isRequired,
    dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
  }),

  previousWinterSeasonDates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      startDate: PropTypes.instanceOf(Date),
      endDate: PropTypes.instanceOf(Date),
      dateType: PropTypes.shape({
        name: PropTypes.string.isRequired,
        id: PropTypes.number.isRequired,
      }),
    }),
  ),

  dateTypes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      strapiDateTypeId: PropTypes.number.isRequired,
      description: PropTypes.string,
    }),
  ).isRequired,

  approver: PropTypes.bool.isRequired,
};
