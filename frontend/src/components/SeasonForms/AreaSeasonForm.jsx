import { faCircleInfo } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  groupBy,
  set as lodashSet,
  cloneDeep,
  mapValues,
  keyBy,
  partition,
} from "lodash-es";
import { memo, useMemo, useContext, useCallback } from "react";
import PropTypes from "prop-types";

import DateRangeFields from "@/components/DateRangeFields";
import FormContainer from "@/components/FormContainer";
import GateForm from "@/components/GateForm";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import TooltipWrapper from "@/components/TooltipWrapper";
import PreviousDates from "@/components/SeasonForms/PreviousDates";

import DataContext from "@/contexts/DataContext";

// Individual Area-Feature form section
function FeatureFormSectionComponent({
  feature,
  featureDateTypes,
  previousFeatureDatesByType,
  featureDatesByType,
  updateFeatureDateRange,
  addFeatureDateRange,
  removeFeatureDateRange,
  dateRangeAnnuals,
  updateDateRangeAnnual,
}) {
  return (
    <div className="area-feature" key={feature.id}>
      <h4 className="feature-name">{feature.name}</h4>

      {featureDateTypes.map((dateType) => (
        <div key={dateType.name} className="col-lg-6 mb-4">
          <h6 className="fw-normal">
            {dateType.name}{" "}
            <TooltipWrapper placement="top" content={dateType.description}>
              <FontAwesomeIcon icon={faCircleInfo} />
            </TooltipWrapper>
          </h6>

          {/* Show previous dates for this featureId/dateableId */}
          <PreviousDates
            dateRanges={previousFeatureDatesByType?.[dateType.name]}
          />

          <DateRangeFields
            dateableId={feature.dateableId}
            dateType={dateType}
            dateRanges={featureDatesByType[feature.dateableId][dateType.id]}
            updateDateRange={(id, dateField, dateObj, tempId = false) =>
              updateFeatureDateRange(
                feature.dateableId,
                id,
                dateField,
                dateObj,
                tempId,
              )
            }
            addDateRange={() =>
              addFeatureDateRange(feature.dateableId, dateType)
            }
            removeDateRange={(dateRange) =>
              removeFeatureDateRange(feature.dateableId, dateRange)
            }
            dateRangeAnnuals={dateRangeAnnuals}
            updateDateRangeAnnual={updateDateRangeAnnual}
          />
        </div>
      ))}
    </div>
  );
}

const dateRangeShape = PropTypes.shape({
  id: PropTypes.number,
  tempId: PropTypes.string,
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  dateType: PropTypes.shape({
    name: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
  }),
});

FeatureFormSectionComponent.propTypes = {
  feature: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    dateableId: PropTypes.number.isRequired,
    dateable: PropTypes.shape({
      dateRanges: PropTypes.arrayOf(dateRangeShape),
    }),
  }).isRequired,
  featureDateTypes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      description: PropTypes.string,
    }),
  ).isRequired,
  previousFeatureDatesByType: PropTypes.objectOf(
    PropTypes.arrayOf(dateRangeShape),
  ).isRequired,
  featureDatesByType: PropTypes.objectOf(
    PropTypes.objectOf(PropTypes.arrayOf(dateRangeShape)),
  ).isRequired,
  updateFeatureDateRange: PropTypes.func.isRequired,
  addFeatureDateRange: PropTypes.func.isRequired,
  removeFeatureDateRange: PropTypes.func.isRequired,
  dateRangeAnnuals: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateDateRangeAnnual: PropTypes.func.isRequired,
};

const FeatureFormSection = memo(FeatureFormSectionComponent);

export default function AreaSeasonForm({
  season,
  previousSeasonDates,
  areaDateTypes,
  featureDateTypes,
  approver,
}) {
  const { setData, addDeletedDateRangeId } = useContext(DataContext);

  const parkArea = season.parkArea;
  const dateRangeAnnuals = season.dateRangeAnnuals || [];
  const gateDetail = season.gateDetail || {};

  const areaDatesByType = useMemo(
    () => groupBy(parkArea.dateable.dateRanges, "dateType.name"),
    [parkArea.dateable.dateRanges],
  );

  // Previous dates for the area and its features
  const previousAreaDatesByType = useMemo(() => {
    const areaDates = previousSeasonDates.filter(
      (date) => date.dateableId === parkArea.dateableId,
    );

    return groupBy(areaDates, "dateType.name");
  }, [previousSeasonDates, parkArea.dateableId]);

  const previousFeatureDatesByType = useMemo(() => {
    const areaDates = previousSeasonDates.filter(
      (date) => date.dateableId !== parkArea.dateableId,
    );

    return groupBy(areaDates, "dateType.name");
  }, [previousSeasonDates, parkArea.dateableId]);

  // Updates the date range in the parent component
  function updateAreaDateRange(id, dateField, dateObj, tempId = false) {
    const { dateRanges } = season.parkArea.dateable;
    // Find the index in dateRanges from the dateRange id or tempId
    const dateRangeIndex = dateRanges.findIndex((range) => {
      if (tempId) {
        return range.tempId === id;
      }

      return range.id === id;
    });

    // Path to update to the DateRange object
    const dateRangePath = [
      "current",
      "parkArea",
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

  // Adds a new date range to the Area's dateable.dateRanges
  function addAreaDateRange(dateType) {
    const newDateRange = {
      // Add a temporary ID for records that haven't been saved yet
      tempId: crypto.randomUUID(),
      startDate: null,
      endDate: null,
      dateableId: parkArea.dateable.id,
      dateType,
      dateTypeId: dateType.id,
      changed: true,
    };

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);

      updatedData.current.parkArea.dateable.dateRanges.push(newDateRange);
      return updatedData;
    });
  }

  // Removes a date range from the Area's dateable.dateRanges by its ID or tempId
  function removeAreaDateRange(dateRange) {
    // Track deleted date range IDs
    if (dateRange.id) {
      addDeletedDateRangeId(dateRange.id);
    }

    setData((prevData) => {
      const updatedData = cloneDeep(prevData);
      const { dateRanges } = updatedData.current.parkArea.dateable;

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
      const index = annuals.findIndex((annual) => {
        if (updatedAnnual?.id) {
          return annual.id === updatedAnnual.id;
        }
        if (updatedAnnual?.tempId) {
          return annual.tempId === updatedAnnual.tempId;
        }
        return false;
      });

      if (index !== -1) {
        annuals[index] = { ...annuals[index], ...updatedAnnual, changed: true };
      } else {
        // add it if it doesn't exist
        // ensure it has a tempId if new
        if (!updatedAnnual.tempId) {
          updatedAnnual.tempId = crypto.randomUUID();
        }
        annuals.push({ ...updatedAnnual, changed: true });
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

  // Area-feature variables
  const features = useMemo(() => parkArea.features || [], [parkArea.features]);
  const [bcpResFeatures, nonBcpResFeatures] = useMemo(
    () => partition(features, (feature) => feature.inReservationSystem),
    [features],
  );

  // Show the BC Parks Reservations section if there are any area date types,
  //  or any features with inReservationSystem
  const showBcpResSection = useMemo(
    () => areaDateTypes.length > 0 || bcpResFeatures.length > 0,
    [areaDateTypes.length, bcpResFeatures.length],
  );

  const showNonBcpResSection = useMemo(
    () => nonBcpResFeatures.length > 0,
    [nonBcpResFeatures.length],
  );

  const featureDatesByType = useMemo(() => {
    // Create objects with IDs as keys to loop over
    const featuresByDateableId = keyBy(features, "dateableId");
    const dateTypesById = keyBy(featureDateTypes, "id");

    // Return an object of dateType groups, grouped by dateableId
    // obj[dateableId][dateTypeId] = dateRanges[]
    return mapValues(
      // Loop through each feature's dateableId
      featuresByDateableId,

      // For each feature, return groups of date ranges by dateType
      (feature) => {
        // Group date ranges by dateTypeId
        const rangesByType = groupBy(feature.dateable.dateRanges, "dateTypeId");

        return mapValues(
          dateTypesById,
          (dateType) => rangesByType[dateType.id] || [],
        );
      },
    );
  }, [features, featureDateTypes]);

  // Adds a new date range to the Area's dateable.dateRanges
  const addFeatureDateRange = useCallback(
    (dateableId, dateType) => {
      const newDateRange = {
        // Add a temporary ID for records that haven't been saved yet
        tempId: crypto.randomUUID(),
        startDate: null,
        endDate: null,
        dateableId,
        dateType,
        dateTypeId: dateType.id,
        changed: true,
      };

      setData((prevData) => {
        const updatedData = cloneDeep(prevData);

        const areaFeatures = updatedData.current.parkArea.features;

        // Find the dateableId within the features array
        const featureIndex = areaFeatures.findIndex(
          (areaFeature) => areaFeature.dateableId === dateableId,
        );

        areaFeatures[featureIndex].dateable.dateRanges.push(newDateRange);

        return updatedData;
      });
    },
    [setData],
  );

  // Removes a date range from a Dateable's dateRanges by its ID or tempId
  const removeFeatureDateRange = useCallback(
    (dateableId, dateRange) => {
      // Track deleted date range IDs
      if (dateRange.id) {
        addDeletedDateRangeId(dateRange.id);
      }

      setData((prevData) => {
        const updatedData = cloneDeep(prevData);
        const areaFeatures = updatedData.current.parkArea.features;

        // Find the dateableId within the features array
        const featureIndex = areaFeatures.findIndex(
          (areaFeature) => areaFeature.dateableId === dateableId,
        );

        const { dateRanges } = areaFeatures[featureIndex].dateable;

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
    },
    [setData, addDeletedDateRangeId],
  );

  // Updates the Feature's date range in the parent component
  const updateFeatureDateRange = useCallback(
    (dateableId, id, dateField, dateObj, tempId = false) => {
      const areaFeatures = season.parkArea.features;
      // Find the feature's dateableId
      const featureIndex = areaFeatures.findIndex(
        (feature) => feature.dateableId === dateableId,
      );

      const { dateRanges } = areaFeatures[featureIndex].dateable;
      // Find the index in dateRanges from the dateRange id or tempId
      const dateRangeIndex = dateRanges.findIndex((range) => {
        if (tempId) {
          return range.tempId === id;
        }

        return range.id === id;
      });

      // Path to update to the DateRange object
      const dateRangePath = [
        "current",
        "parkArea",
        "features",
        featureIndex,
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
    },
    [setData, season.parkArea.features],
  );

  return (
    <>
      {showBcpResSection && (
        <FormContainer>
          <div className="row">
            {/* Area-level dates */}
            {areaDateTypes.map((dateType) => (
              <div key={dateType.name} className="col-lg-6 mb-4">
                <h6 className="fw-normal">
                  {dateType.name}{" "}
                  <TooltipWrapper
                    placement="top"
                    content={dateType.description}
                  >
                    <FontAwesomeIcon icon={faCircleInfo} />
                  </TooltipWrapper>
                </h6>

                <PreviousDates
                  dateRanges={previousAreaDatesByType?.[dateType.name]}
                />

                <DateRangeFields
                  dateableId={parkArea.dateableId}
                  dateType={dateType}
                  dateRanges={areaDatesByType[dateType.name] ?? []}
                  updateDateRange={updateAreaDateRange}
                  addDateRange={addAreaDateRange}
                  removeDateRange={removeAreaDateRange}
                  dateRangeAnnuals={dateRangeAnnuals}
                  updateDateRangeAnnual={updateDateRangeAnnual}
                />
              </div>
            ))}

            {/*
            Feature-level dates within this Area with inReservationSystem=true
            (Features have their own add/update/delete functions)
            */}
            {bcpResFeatures.map((feature) => (
              <FeatureFormSection
                feature={feature}
                featureDateTypes={featureDateTypes}
                previousFeatureDatesByType={previousFeatureDatesByType}
                featureDatesByType={featureDatesByType}
                updateFeatureDateRange={updateFeatureDateRange}
                addFeatureDateRange={addFeatureDateRange}
                removeFeatureDateRange={removeFeatureDateRange}
                dateRangeAnnuals={dateRangeAnnuals}
                updateDateRangeAnnual={updateDateRangeAnnual}
                key={feature.id}
              />
            ))}
          </div>
        </FormContainer>
      )}

      {showNonBcpResSection && (
        <div className="non-bcp-reservations">
          {/*
          Feature-level dates within this Area with inReservationSystem=false
          (Features have their own add/update/delete functions)
        */}
          {nonBcpResFeatures.map((feature) => (
            <FeatureFormSection
              feature={feature}
              featureDateTypes={featureDateTypes}
              previousFeatureDatesByType={previousFeatureDatesByType}
              featureDatesByType={featureDatesByType}
              updateFeatureDateRange={updateFeatureDateRange}
              addFeatureDateRange={addFeatureDateRange}
              removeFeatureDateRange={removeFeatureDateRange}
              dateRangeAnnuals={dateRangeAnnuals}
              updateDateRangeAnnual={updateDateRangeAnnual}
              key={feature.id}
            />
          ))}
        </div>
      )}

      <GateForm
        gateTitle={`${parkArea.name} gate`}
        gateDescription={`Does ${parkArea.name} have a gated entrance?`}
        gateDetail={gateDetail}
        updateGateDetail={updateGateDetail}
        level={"park-area"}
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
AreaSeasonForm.propTypes = {
  season: PropTypes.shape({
    parkArea: PropTypes.object.isRequired,
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

  areaDateTypes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      description: PropTypes.string,
    }),
  ).isRequired,

  featureDateTypes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      description: PropTypes.string,
    }),
  ).isRequired,

  approver: PropTypes.bool.isRequired,
};
