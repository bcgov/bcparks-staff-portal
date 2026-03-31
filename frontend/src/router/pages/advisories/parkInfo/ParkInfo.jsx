import { useState, useEffect, useContext } from "react";
import ErrorContext from "@/contexts/ErrorContext";
import CmsDataContext from "@/contexts/CmsDataContext";
import "./ParkInfo.css";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import { useAuth } from "react-oidc-context";
import { cmsAxios } from "@/lib/advisories/axios_config";
import { getRegions, getSections } from "@/lib/advisories/utils/CmsDataUtil";
import { Button } from "@/components/advisories/shared/button/Button";
import { Accordion, Form, Tab, Tabs } from "react-bootstrap";
import moment from "moment";
import SwitchButton from "@/components/advisories/base/switchButton/SwitchButton";
import HTMLArea from "@/components/advisories/base/HTMLArea/HTMLArea";
import qs from "qs";

export default function ParkInfo() {
  const { setError } = useContext(ErrorContext);
  const { cmsData, setCmsData } = useContext(CmsDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const [toError, setToError] = useState(false);
  const [protectedArea, setProtectedArea] = useState();
  const [expandedActivities, setExpandedActivities] = useState([]);
  const [editableActivities, setEditableActivities] = useState([]);
  const [expandedFacilities, setExpandedFacilities] = useState([]);
  const [editableFacilities, setEditableFacilities] = useState([]);
  const [expandedCampingTypes, setExpandedCampingTypes] = useState([]);
  const [editableCampingTypes, setEditableCampingTypes] = useState([]);
  const [parkActivities, setParkActivities] = useState([]);
  const [parkFacilities, setParkFacilities] = useState([]);
  const [parkCampingTypes, setParkCampingTypes] = useState([]);
  const [submittingActivities, setSubmittingActivities] = useState([]);
  const [submittingFacilities, setSubmittingFacilities] = useState([]);
  const [submittingCampingTypes, setSubmittingCampingTypes] = useState([]);
  const [loadParkInfo, setLoadParkInfo] = useState(true);
  const auth = useAuth();
  const initialized = !auth.isLoading;
  const keycloak = auth.isAuthenticated ? auth.user : null;
  const keycloakToken = auth.user?.access_token;
  const { id } = useParams();
  const navigate = useNavigate();

  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const query = qs.stringify(
      {
        populate: [
          "managementAreas",
          "managementAreas.region",
          "managementAreas.section",
          "parkActivities",
          "parkActivities.activityType",
          "parkActivities.protectedArea",
          "parkActivities.site",
          "parkFacilities",
          "parkFacilities.facilityType",
          "parkFacilities.protectedArea",
          "parkFacilities.site",
          "parkCampingTypes",
          "parkCampingTypes.campingType",
          "parkCampingTypes.protectedArea",
          "parkCampingTypes.site",
        ],
        filters: {
          orcs: {
            $eq: `${id}`,
          },
        },
      },
      {
        encodeValuesOnly: true,
      },
    );

    if (initialized && keycloak && loadParkInfo) {
      Promise.all([
        cmsAxios.get(`/protected-areas?${query}`),
        getRegions(cmsData, setCmsData),
        getSections(cmsData, setCmsData),
      ])
        .then((res) => {
          const protectedAreaData = res[0].data.data[0];

          if (protectedAreaData.managementAreas?.length > 0) {
            const managementArea = protectedAreaData.managementAreas[0];

            protectedAreaData.managementAreaName =
              managementArea.managementAreaName;
            const region = cmsData.regions.filter(
              (r) => r.documentId === managementArea.region.documentId,
            );

            if (region.length > 0) {
              protectedAreaData.regionName = region[0].regionName;
            }
            const section = cmsData.sections.filter(
              (s) => s.documentId === managementArea.section.documentId,
            );

            if (section.length > 0) {
              protectedAreaData.sectionName = section[0].sectionName;
            }
          }
          if (protectedAreaData.parkActivities?.length > 0) {
            const activities = protectedAreaData.parkActivities.map(
              (activity) => ({
                id: activity.documentId,
                description: activity.description,
                name: activity.name,
                isActivityOpen: activity.isActivityOpen,
                isActive: activity.isActive,
                protectedArea: activity.protectedArea,
                site: activity.site,
                activityType: activity.activityType,
              }),
            );

            if (isMounted) {
              setParkActivities([...activities]);
            }
          }
          if (protectedAreaData.parkFacilities?.length > 0) {
            const facilities = protectedAreaData.parkFacilities.map(
              (facility) => ({
                id: facility.documentId,
                description: facility.description,
                name: facility.name,
                isFacilityOpen: facility.isFacilityOpen,
                isActive: facility.isActive,
                protectedArea: facility.protectedArea,
                site: facility.site,
                facilityType: facility.facilityType,
              }),
            );

            if (isMounted) {
              setParkFacilities([...facilities]);
            }
          }
          if (protectedAreaData.parkCampingTypes?.length > 0) {
            const campingTypes = protectedAreaData.parkCampingTypes.map(
              (campingType) => ({
                id: campingType.documentId,
                description: campingType.description,
                name: campingType.name,
                isCampingOpen: campingType.isCampingOpen,
                isActive: campingType.isActive,
                protectedArea: campingType.protectedArea,
                site: campingType.site,
                campingType: campingType.campingType,
              }),
            );

            if (isMounted) {
              setParkCampingTypes([...campingTypes]);
            }
          }
          if (isMounted) {
            setProtectedArea(protectedAreaData);
            setIsLoading(false);
            setLoadParkInfo(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setToError(true);
            setError({
              status: 500,
              message: "Error fetching park information",
            });
            setIsLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [
    cmsData,
    id,
    initialized,
    keycloak,
    setCmsData,
    setError,
    setIsLoading,
    loadParkInfo,
    setProtectedArea,
    setToError,
    setLoadParkInfo,
    setParkActivities,
    setParkFacilities,
    setParkCampingTypes,
  ]);

  function handleTabChange(val) {
    setTabIndex(val);
  }

  function getCollapsedDescription(description) {
    if (!description) {
      return "No description";
    }

    if (description.length < 100) {
      return description;
    }

    return `${description.slice(0, 100)}...`;
  }

  function handleActivityAccordionChange(_, isExpanded, activityId) {
    if (isExpanded) {
      const currentActivities = [...expandedActivities, activityId];

      setExpandedActivities([...currentActivities]);
    } else {
      const currentActivities = expandedActivities.filter(
        (a) => a !== activityId,
      );

      setExpandedActivities([...currentActivities]);
    }
  }

  function editActivityDesc(activityId) {
    const currentActivities = [...editableActivities, activityId];

    setEditableActivities([...currentActivities]);
  }

  function finishEditActivityDesc(activityId, expand) {
    const currentActivities = editableActivities.filter(
      (a) => a !== activityId,
    );

    setEditableActivities([...currentActivities]);
    handleActivityAccordionChange(null, expand, activityId);
  }

  function cancelEditActivityDesc(activityId) {
    const currentActivity = parkActivities.find((a) => a.id === activityId);
    const unchangedActivity = protectedArea.parkActivities.find(
      (a) => a.documentId === activityId,
    );

    currentActivity.description = unchangedActivity.description;
    finishEditActivityDesc(activityId, true);
  }

  function saveActivity(activityId, expand) {
    const activities = parkActivities.filter((d) => d.id === activityId);

    if (activities.length > 0) {
      const activity = activities[0];
      const parkActivity = {
        name: activity.name,
        description: activity.description,
        isActivityOpen: activity.isActivityOpen,
        isActive: activity.isActive,
        modifiedBy: auth.user?.profile?.name,
        modifiedDate: moment().toISOString(),
        protectedArea: activity.protectedArea?.documentId,
        site: activity.site?.documentId,
        activityType: activity.activityType?.documentId,
      };

      cmsAxios
        .put(
          `park-activities/${activityId}`,
          { data: parkActivity },
          {
            headers: { Authorization: `Bearer ${keycloakToken}` },
          },
        )
        .then(() => {
          const currentActivities = submittingActivities.filter(
            (a) => a !== activityId,
          );

          setSubmittingActivities([...currentActivities]);
          finishEditActivityDesc(activityId, expand);
          setLoadParkInfo(true);
        })
        .catch((error) => {
          console.error("error occurred", error);
          setToError(true);
          setError({
            status: 500,
            message: "Could not update activity",
          });
        });
    }
  }

  function handleActivityDescriptionChange(event, activityId) {
    const currentDescriptions = parkActivities;

    currentDescriptions.filter((d) => {
      if (d.id === activityId) {
        d.description = event.target.value;
      }
      return "";
    });
    setParkActivities([...currentDescriptions]);
  }

  function handleActivityDisplayChange(activityId) {
    const currentActivities = parkActivities;

    currentActivities.filter((d) => {
      if (d.id === activityId) {
        d.isActive = !d.isActive;
      }
      return "";
    });
    setParkActivities([...currentActivities]);
    saveActivity(activityId, false);
  }

  function handleActivityOpenChange(activityId) {
    const currentActivities = parkActivities;

    currentActivities.filter((d) => {
      if (d.id === activityId) {
        d.isActivityOpen = !d.isActivityOpen;
      }
      return "";
    });
    setParkActivities([...currentActivities]);
    saveActivity(activityId, false);
  }

  function handleActivitySubmitLoader(activityId) {
    const currentActivities = [...submittingActivities, activityId];

    setSubmittingActivities([...currentActivities]);
  }

  function handleFacilityAccordionChange(_, isExpanded, facilityId) {
    if (isExpanded) {
      const currentFacilities = [...expandedFacilities, facilityId];

      setExpandedFacilities([...currentFacilities]);
    } else {
      const currentFacilities = expandedFacilities.filter(
        (f) => f !== facilityId,
      );

      setExpandedFacilities([...currentFacilities]);
    }
  }

  function editFacilityDesc(facilityId) {
    const currentFacilities = [...editableFacilities, facilityId];

    setEditableFacilities([...currentFacilities]);
  }

  function finishEditFacilityDesc(facilityId, expand) {
    const currentFacilities = editableFacilities.filter(
      (f) => f !== facilityId,
    );

    setEditableFacilities([...currentFacilities]);
    handleFacilityAccordionChange(null, expand, facilityId);
  }

  function cancelEditFacilityDesc(facilityId) {
    const currentFacility = parkFacilities.find((f) => f.id === facilityId);
    const unchangedFacility = protectedArea.parkFacilities.find(
      (f) => f.documentId === facilityId,
    );

    currentFacility.description = unchangedFacility.description;
    finishEditFacilityDesc(facilityId, true);
  }

  function saveFacility(facilityId, expand) {
    const facilities = parkFacilities.filter((d) => d.id === facilityId);

    if (facilities.length > 0) {
      const facility = facilities[0];
      const parkFacility = {
        name: facility.name,
        description: facility.description,
        isFacilityOpen: facility.isFacilityOpen,
        isActive: facility.isActive,
        modifiedBy: auth.user?.profile?.name,
        modifiedDate: moment().toISOString(),
        protectedArea: facility.protectedArea?.documentId,
        site: facility.site?.documentId,
        facilityType: facility.facilityType?.documentId,
      };

      cmsAxios
        .put(
          `park-facilities/${facilityId}`,
          { data: parkFacility },
          {
            headers: { Authorization: `Bearer ${keycloakToken}` },
          },
        )
        .then(() => {
          const currentFacilities = submittingFacilities.filter(
            (f) => f !== facilityId,
          );

          setSubmittingFacilities([...currentFacilities]);
          finishEditFacilityDesc(facilityId, expand);
          setLoadParkInfo(true);
        })
        .catch((error) => {
          console.error("error occurred", error);
          setToError(true);
          setError({
            status: 500,
            message: "Could not update facility",
          });
        });
    }
  }

  function handleFacilityDescriptionChange(event, facilityId) {
    const currentDescriptions = parkFacilities;

    currentDescriptions.filter((d) => {
      if (d.id === facilityId) {
        d.description = event.target.value;
      }
      return "";
    });
    setParkFacilities([...currentDescriptions]);
  }

  function handleFacilityDisplayChange(facilityId) {
    const currentFacilities = parkFacilities;

    currentFacilities.filter((d) => {
      if (d.id === facilityId) {
        d.isActive = !d.isActive;
      }
      return "";
    });
    setParkFacilities([...currentFacilities]);
    saveFacility(facilityId, false);
  }

  function handleFacilityOpenChange(facilityId) {
    const currentFacilities = parkFacilities;

    currentFacilities.filter((d) => {
      if (d.id === facilityId) {
        d.isFacilityOpen = !d.isFacilityOpen;
      }
      return "";
    });
    setParkFacilities([...currentFacilities]);
    saveFacility(facilityId, false);
  }

  function handleFacilitySubmitLoader(facilityId) {
    const currentFacilities = [...submittingFacilities, facilityId];

    setSubmittingFacilities([...currentFacilities]);
  }

  function handleCampingTypeAccordionChange(_, isExpanded, campingTypeId) {
    if (isExpanded) {
      const currentCampingTypes = [...expandedCampingTypes, campingTypeId];

      setExpandedCampingTypes([...currentCampingTypes]);
    } else {
      const currentCampingTypes = expandedCampingTypes.filter(
        (f) => f !== campingTypeId,
      );

      setExpandedCampingTypes([...currentCampingTypes]);
    }
  }

  function editCampingTypeDesc(campingTypeId) {
    const currentCampingTypes = [...editableCampingTypes, campingTypeId];

    setEditableCampingTypes([...currentCampingTypes]);
  }

  function finishEditCampingTypeDesc(campingTypeId, expand) {
    const currentCampingTypes = editableCampingTypes.filter(
      (f) => f !== campingTypeId,
    );

    setEditableCampingTypes([...currentCampingTypes]);
    handleCampingTypeAccordionChange(null, expand, campingTypeId);
  }

  function cancelEditCampingTypeDesc(campingTypeId) {
    const currentCampingType = parkCampingTypes.find(
      (f) => f.id === campingTypeId,
    );
    const unchangedCampingType = protectedArea.parkCampingTypes.find(
      (f) => f.documentId === campingTypeId,
    );

    currentCampingType.description = unchangedCampingType.description;
    finishEditCampingTypeDesc(campingTypeId, true);
  }

  function saveCampingType(campingTypeId, expand) {
    const campingTypes = parkCampingTypes.filter((d) => d.id === campingTypeId);

    if (campingTypes.length > 0) {
      const campingType = campingTypes[0];
      const parkCampingType = {
        name: campingType.name,
        description: campingType.description,
        isCampingOpen: campingType.isCampingOpen,
        isActive: campingType.isActive,
        modifiedBy: auth.user?.profile?.name,
        modifiedDate: moment().toISOString(),
        protectedArea: campingType.protectedArea?.documentId,
        site: campingType.site?.documentId,
        campingType: campingType.campingType?.documentId,
      };

      cmsAxios
        .put(
          `park-camping-types/${campingTypeId}`,
          { data: parkCampingType },
          {
            headers: { Authorization: `Bearer ${keycloakToken}` },
          },
        )
        .then(() => {
          const currentCampingTypes = submittingCampingTypes.filter(
            (f) => f !== campingTypeId,
          );

          setSubmittingCampingTypes([...currentCampingTypes]);
          finishEditCampingTypeDesc(campingTypeId, expand);
          setLoadParkInfo(true);
        })
        .catch((error) => {
          console.error("error occurred", error);
          setToError(true);
          setError({
            status: 500,
            message: "Could not update campingType",
          });
        });
    }
  }

  function handleCampingTypeDescriptionChange(event, campingTypeId) {
    const currentDescriptions = parkCampingTypes;

    currentDescriptions.filter((d) => {
      if (d.id === campingTypeId) {
        d.description = event.target.value;
      }
      return "";
    });
    setParkCampingTypes([...currentDescriptions]);
  }

  function handleCampingTypeDisplayChange(campingTypeId) {
    const currentCampingTypes = parkCampingTypes;

    currentCampingTypes.filter((d) => {
      if (d.id === campingTypeId) {
        d.isActive = !d.isActive;
      }
      return "";
    });
    setParkCampingTypes([...currentCampingTypes]);
    saveCampingType(campingTypeId, false);
  }

  function handleCampingTypeOpenChange(campingTypeId) {
    const currentCampingTypes = parkCampingTypes;

    currentCampingTypes.filter((d) => {
      if (d.id === campingTypeId) {
        d.isCampingOpen = !d.isCampingOpen;
      }
      return "";
    });
    setParkCampingTypes([...currentCampingTypes]);
    saveCampingType(campingTypeId, false);
  }

  function handleCampingTypeSubmitLoader(campingTypeId) {
    const currentCampingTypes = [...submittingCampingTypes, campingTypeId];

    setSubmittingCampingTypes([...currentCampingTypes]);
  }

  if (toError) {
    return <Navigate to="/error" />;
  }

  return (
    <main className="advisories-styles">
      <div className="ParkInfo" data-testid="ParkInfo">
        <div className="container">
          {isLoading && (
            <div className="page-loader">
              <Loader page />
            </div>
          )}
          {!isLoading && (
            <div className="container-fluid">
              <div className="container-fluid">
                <Button
                  label="Back"
                  styling="bcgov-normal-white btn mt-4"
                  onClick={() => {
                    navigate("/activities-and-facilities");
                  }}
                />
              </div>
              <br />
              <div className="pt10b30">
                <div className="container-fluid">
                  <h3>{protectedArea.protectedAreaName}</h3>
                  {protectedArea.regionName && (
                    <div>{protectedArea.regionName} Region</div>
                  )}
                  {protectedArea.sectionName && (
                    <div>{protectedArea.sectionName} Section</div>
                  )}
                  {protectedArea.managementAreaName && (
                    <div>
                      {protectedArea.managementAreaName} Management Area
                    </div>
                  )}
                </div>
                <div className="container park-tabs mt20">
                  <Tabs
                    activeKey={`${tabIndex}`}
                    aria-label="Park-Info"
                    className="park-tab"
                    fill
                    onSelect={handleTabChange}
                  >
                    <Tab eventKey="0" title="Activities">
                      {parkActivities && parkActivities.length > 0 && (
                        <div>
                          <div className="row pt2b2 mx-0">
                            <div className="col-lg-3 col-md-12 col-12 park-header">
                              Activity
                            </div>
                            <div className="col-lg-1 col-md-12 col-12 park-header">
                              Display
                            </div>
                            <div className="col-lg-1 col-md-12 col-12 park-header">
                              Open
                            </div>
                            <div className="col-lg-3 col-md-12 col-12 park-header">
                              Fees
                            </div>
                            <div className="col-lg-4 col-md-12 col-12 park-header no-right-border">
                              Description
                            </div>
                          </div>
                          {parkActivities.map((a) => (
                            <div className="row pt2b2 mx-0" key={`activity-${a.id}`}>
                              <div className="col-lg-3 col-md-12 col-12 park-content">
                                {a.name}
                              </div>
                              <div className="col-lg-1 col-md-12 col-12 park-content">
                                <SwitchButton
                                  checked={a.isActive}
                                  name={`${a.id}-is-active`}
                                  inputProps={{
                                    "aria-label": "active activity",
                                  }}
                                  onChange={() => {
                                    handleActivityDisplayChange(a.id);
                                  }}
                                />
                              </div>
                              <div className="col-lg-1 col-md-12 col-12 park-content">
                                <SwitchButton
                                  checked={a.isActivityOpen}
                                  name={`${a.id}-is-open`}
                                  inputProps={{
                                    "aria-label": "open activity",
                                  }}
                                  onChange={() => {
                                    handleActivityOpenChange(a.id);
                                  }}
                                />
                              </div>
                              <div className="col-lg-3 col-md-12 col-12 park-content">
                                Add a fee
                              </div>
                              <div className="col-lg-4 col-md-12 col-12 park-content no-right-border">
                                <div className="wrap-text">
                                  <Accordion
                                    className="park-desc"
                                    activeKey={
                                      expandedActivities.includes(a.id)
                                        ? `${a.id}`
                                        : null
                                    }
                                    onSelect={(eventKey) => {
                                      handleActivityAccordionChange(
                                        null,
                                        eventKey === `${a.id}`,
                                        a.id,
                                      );
                                    }}
                                  >
                                    <Accordion.Item eventKey={`${a.id}`}>
                                      <Accordion.Header>
                                        {!expandedActivities.includes(a.id) && (
                                          <HTMLArea>
                                            {getCollapsedDescription(
                                              a.description,
                                            )}
                                          </HTMLArea>
                                        )}
                                      </Accordion.Header>
                                      <Accordion.Body>
                                        {!editableActivities.includes(a.id) && (
                                          <HTMLArea>
                                            {a.description || "No description"}
                                          </HTMLArea>
                                        )}
                                        {editableActivities.includes(a.id) && (
                                          <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={a.description || ""}
                                            onChange={(event) => {
                                              handleActivityDescriptionChange(
                                                event,
                                                a.id,
                                              );
                                            }}
                                            className="bcgov-input white-background"
                                            id={`activity-${a.id}-desc`}
                                            placeholder="Enter activity description"
                                          />
                                        )}
                                        <div className="park-desc-actions">
                                          {!editableActivities.includes(
                                            a.id,
                                          ) && (
                                            <Button
                                              label="Edit"
                                              styling="bcgov-normal-blue btn mt10"
                                              onClick={() => {
                                                editActivityDesc(a.id);
                                              }}
                                            />
                                          )}
                                          {editableActivities.includes(
                                            a.id,
                                          ) && (
                                            <>
                                              <Button
                                                label="Cancel"
                                                styling="bcgov-normal-white btn mt10"
                                                onClick={() => {
                                                  cancelEditActivityDesc(a.id);
                                                }}
                                              />
                                              <Button
                                                label="Save"
                                                styling="bcgov-normal-blue btn mt10"
                                                onClick={() => {
                                                  handleActivitySubmitLoader(
                                                    a.id,
                                                  );
                                                  saveActivity(a.id, true);
                                                }}
                                                hasLoader={submittingActivities.includes(
                                                  a.id,
                                                )}
                                              />
                                            </>
                                          )}
                                        </div>
                                      </Accordion.Body>
                                    </Accordion.Item>
                                  </Accordion>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!parkActivities || parkActivities.length === 0) && (
                        <div className="park-empty-info">
                          No activities found
                        </div>
                      )}
                    </Tab>
                    <Tab eventKey="1" title="Facilities">
                      {parkFacilities && parkFacilities.length > 0 && (
                        <div>
                          <div className="row pt2b2 mx-0">
                            <div className="col-lg-3 col-md-12 col-12 park-header">
                              Facility
                            </div>
                            <div className="col-lg-1 col-md-12 col-12 park-header">
                              Display
                            </div>
                            <div className="col-lg-1 col-md-12 col-12 park-header">
                              Open
                            </div>
                            <div className="col-lg-3 col-md-12 col-12 park-header">
                              Fees
                            </div>
                            <div className="col-lg-4 col-md-12 col-12 park-header no-right-border">
                              Description
                            </div>
                          </div>
                          {parkFacilities.map((f) => (
                            <div className="row pt2b2 mx-0" key={`facility-${f.id}`}>
                              <div className="col-lg-3 col-md-12 col-12 park-content">
                                {f.name}
                              </div>
                              <div className="col-lg-1 col-md-12 col-12 park-content">
                                <SwitchButton
                                  checked={f.isActive}
                                  name={`${f.id}-is-active`}
                                  inputProps={{
                                    "aria-label": "active facility",
                                  }}
                                  onChange={() => {
                                    handleFacilityDisplayChange(f.id);
                                  }}
                                />
                              </div>
                              <div className="col-lg-1 col-md-12 col-12 park-content">
                                <SwitchButton
                                  checked={f.isFacilityOpen}
                                  name={`${f.id}-is-open`}
                                  inputProps={{
                                    "aria-label": "open facility",
                                  }}
                                  onChange={() => {
                                    handleFacilityOpenChange(f.id);
                                  }}
                                />
                              </div>
                              <div className="col-lg-3 col-md-12 col-12 park-content">
                                Add a fee
                              </div>
                              <div className="col-lg-4 col-md-12 col-12 park-content no-right-border">
                                <div className="wrap-text">
                                  <Accordion
                                    className="park-desc"
                                    activeKey={
                                      expandedFacilities.includes(f.id)
                                        ? `${f.id}`
                                        : null
                                    }
                                    onSelect={(eventKey) => {
                                      handleFacilityAccordionChange(
                                        null,
                                        eventKey === `${f.id}`,
                                        f.id,
                                      );
                                    }}
                                  >
                                    <Accordion.Item eventKey={`${f.id}`}>
                                      <Accordion.Header>
                                        {!expandedFacilities.includes(f.id) && (
                                          <HTMLArea>
                                            {getCollapsedDescription(
                                              f.description,
                                            )}
                                          </HTMLArea>
                                        )}
                                      </Accordion.Header>
                                      <Accordion.Body>
                                        {!editableFacilities.includes(f.id) && (
                                          <HTMLArea>
                                            {f.description || "No description"}
                                          </HTMLArea>
                                        )}
                                        {editableFacilities.includes(f.id) && (
                                          <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={f.description || ""}
                                            onChange={(event) => {
                                              handleFacilityDescriptionChange(
                                                event,
                                                f.id,
                                              );
                                            }}
                                            className="bcgov-input white-background"
                                            id={`facility-${f.id}-desc`}
                                            placeholder="Enter facility description"
                                          />
                                        )}
                                        <div className="park-desc-actions">
                                          {!editableFacilities.includes(
                                            f.id,
                                          ) && (
                                            <Button
                                              label="Edit"
                                              styling="bcgov-normal-blue btn mt10"
                                              onClick={() => {
                                                editFacilityDesc(f.id);
                                              }}
                                            />
                                          )}
                                          {editableFacilities.includes(
                                            f.id,
                                          ) && (
                                            <>
                                              <Button
                                                label="Cancel"
                                                styling="bcgov-normal-white btn mt10"
                                                onClick={() => {
                                                  cancelEditFacilityDesc(f.id);
                                                }}
                                              />
                                              <Button
                                                label="Save"
                                                styling="bcgov-normal-blue btn mt10"
                                                onClick={() => {
                                                  handleFacilitySubmitLoader(
                                                    f.id,
                                                  );
                                                  saveFacility(f.id, true);
                                                }}
                                                hasLoader={submittingFacilities.includes(
                                                  f.id,
                                                )}
                                              />
                                            </>
                                          )}
                                        </div>
                                      </Accordion.Body>
                                    </Accordion.Item>
                                  </Accordion>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!parkFacilities || parkFacilities.length === 0) && (
                        <div className="park-empty-info">
                          No facilities found
                        </div>
                      )}
                    </Tab>
                    <Tab eventKey="2" title="Camping Types">
                      {parkCampingTypes && parkCampingTypes.length > 0 && (
                        <div>
                          <div className="row pt2b2 mx-0">
                            <div className="col-lg-3 col-md-12 col-12 park-header">
                              Camping Type
                            </div>
                            <div className="col-lg-1 col-md-12 col-12 park-header">
                              Display
                            </div>
                            <div className="col-lg-1 col-md-12 col-12 park-header">
                              Open
                            </div>
                            <div className="col-lg-3 col-md-12 col-12 park-header">
                              Fees
                            </div>
                            <div className="col-lg-4 col-md-12 col-12 park-header no-right-border">
                              Description
                            </div>
                          </div>
                          {parkCampingTypes.map((f) => (
                            <div
                              className="row pt2b2 mx-0"
                              key={`campingType-${f.id}`}
                            >
                              <div className="col-lg-3 col-md-12 col-12 park-content">
                                {f.name.split(":")[1] || f.name}
                              </div>
                              <div className="col-lg-1 col-md-12 col-12 park-content">
                                <SwitchButton
                                  checked={f.isActive}
                                  name={`${f.id}-is-active`}
                                  inputProps={{
                                    "aria-label": "active camping type",
                                  }}
                                  onChange={() => {
                                    handleCampingTypeDisplayChange(f.id);
                                  }}
                                />
                              </div>
                              <div className="col-lg-1 col-md-12 col-12 park-content">
                                <SwitchButton
                                  checked={f.isCampingOpen}
                                  name={`${f.id}-is-open`}
                                  inputProps={{
                                    "aria-label": "open camping type",
                                  }}
                                  onChange={() => {
                                    handleCampingTypeOpenChange(f.id);
                                  }}
                                />
                              </div>
                              <div className="col-lg-3 col-md-12 col-12 park-content">
                                Add a fee
                              </div>
                              <div className="col-lg-4 col-md-12 col-12 park-content no-right-border">
                                <div className="wrap-text">
                                  <Accordion
                                    className="park-desc"
                                    activeKey={
                                      expandedCampingTypes.includes(f.id)
                                        ? `${f.id}`
                                        : null
                                    }
                                    onSelect={(eventKey) => {
                                      handleCampingTypeAccordionChange(
                                        null,
                                        eventKey === `${f.id}`,
                                        f.id,
                                      );
                                    }}
                                  >
                                    <Accordion.Item eventKey={`${f.id}`}>
                                      <Accordion.Header>
                                        {!expandedCampingTypes.includes(
                                          f.id,
                                        ) && (
                                          <HTMLArea>
                                            {getCollapsedDescription(
                                              f.description,
                                            )}
                                          </HTMLArea>
                                        )}
                                      </Accordion.Header>
                                      <Accordion.Body>
                                        {!editableCampingTypes.includes(
                                          f.id,
                                        ) && (
                                          <HTMLArea>
                                            {f.description || "No description"}
                                          </HTMLArea>
                                        )}
                                        {editableCampingTypes.includes(
                                          f.id,
                                        ) && (
                                          <Form.Control
                                            as="textarea"
                                            rows={4}
                                            value={f.description || ""}
                                            onChange={(event) => {
                                              handleCampingTypeDescriptionChange(
                                                event,
                                                f.id,
                                              );
                                            }}
                                            className="bcgov-input white-background"
                                            id={`campingType-${f.id}-desc`}
                                            placeholder="Enter camping type description"
                                          />
                                        )}
                                        <div className="park-desc-actions">
                                          {!editableCampingTypes.includes(
                                            f.id,
                                          ) && (
                                            <Button
                                              label="Edit"
                                              styling="bcgov-normal-blue btn mt10"
                                              onClick={() => {
                                                editCampingTypeDesc(f.id);
                                              }}
                                            />
                                          )}
                                          {editableCampingTypes.includes(
                                            f.id,
                                          ) && (
                                            <>
                                              <Button
                                                label="Cancel"
                                                styling="bcgov-normal-white btn mt10"
                                                onClick={() => {
                                                  cancelEditCampingTypeDesc(
                                                    f.id,
                                                  );
                                                }}
                                              />
                                              <Button
                                                label="Save"
                                                styling="bcgov-normal-blue btn mt10"
                                                onClick={() => {
                                                  handleCampingTypeSubmitLoader(
                                                    f.id,
                                                  );
                                                  saveCampingType(f.id, true);
                                                }}
                                                hasLoader={submittingCampingTypes.includes(
                                                  f.id,
                                                )}
                                              />
                                            </>
                                          )}
                                        </div>
                                      </Accordion.Body>
                                    </Accordion.Item>
                                  </Accordion>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(!parkCampingTypes || parkCampingTypes.length === 0) && (
                        <div className="park-empty-info">
                          No camping types found
                        </div>
                      )}
                    </Tab>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
