import {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  Navigate,
  useLocation,
  useBlocker,
  useParams,
  useSearchParams,
} from "react-router-dom";
import PropTypes from "prop-types";
import "./Advisory.css";
import moment from "moment";
import "moment-timezone";
import { useAuth } from "react-oidc-context";
import { calculateAfterHours } from "@/lib/advisories/utils/AdvisoryUtil";
import AdvisoryForm from "@/components/advisories/composite/advisoryForm/AdvisoryForm";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import { labelCompare } from "@/lib/advisories/utils/AppUtil";
import getEnv from "@/config/getEnv";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fa-kit/icons/classic/solid";
import qs from "qs";
import useAccess from "@/hooks/useAccess";
import useAdvisoryRole from "@/hooks/advisories/useAdvisoryRole";
import useCms from "@/hooks/useCms";
import useUnsavedChangesDialog from "@/hooks/useUnsavedChangesDialog";
import useNavigationGuard from "@/hooks/useNavigationGuard";
import UnsavedChangesDialog from "@/components/advisories/composite/advisoryForm/UnsavedChangesDialog";
import ErrorContext from "@/contexts/ErrorContext";
import { ROLES } from "@/config/permissions";

export default function Advisory({ mode }) {
  const { setError } = useContext(ErrorContext);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tabParam = searchParams.get("tab");
  const fromSummary = location.state?.fromSummary === true;

  const [revisionNumber, setRevisionNumber] = useState();
  const [standardMessages, setStandardMessages] = useState([]);
  const [selectedStandardMessages, setSelectedStandardMessages] = useState([]);
  const [recreationResources, setRecreationResources] = useState([]);
  const [selectedRecreationResources, setSelectedRecreationResources] =
    useState([]);
  const [protectedAreas, setProtectedAreas] = useState([]);
  const [selectedProtectedAreas, setSelectedProtectedAreas] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [managementAreas, setManagementAreas] = useState([]);
  const [selectedManagementAreas, setSelectedManagementAreas] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [fireCentres, setFireCentres] = useState([]);
  const [selectedFireCentres, setSelectedFireCentres] = useState([]);
  const [fireZones, setFireZones] = useState([]);
  const [selectedFireZones, setSelectedFireZones] = useState([]);
  const [naturalResourceDistricts, setNaturalResourceDistricts] = useState([]);
  const [
    selectedNaturalResourceDistricts,
    setSelectedNaturalResourceDistricts,
  ] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [eventType, setEventType] = useState();
  const [accessStatuses, setAccessStatuses] = useState([]);
  const [accessStatus, setAccessStatus] = useState();
  const [urgencies, setUrgencies] = useState([]);
  const [urgency, setUrgency] = useState();
  const [advisoryStatuses, setAdvisoryStatuses] = useState([]);
  const [advisoryStatus, setAdvisoryStatus] = useState(null);
  const [linkTypes, setLinkTypes] = useState([]);
  const [links, setLinks] = useState([]);
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [isSafetyRelated, setIsSafetyRelated] = useState(false);
  const [advisoryDate, setAdvisoryDate] = useState(
    moment().tz("America/Vancouver").toDate(),
  );
  const [displayAdvisoryDate, setDisplayAdvisoryDate] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [displayStartDate, setDisplayStartDate] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const [displayEndDate, setDisplayEndDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [updatedDate, setUpdatedDate] = useState(null);
  const [displayUpdatedDate, setDisplayUpdatedDate] = useState(false);
  const [notes, setNotes] = useState("");
  const [submittedByName, setSubmittedByName] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [listingRank, setListingRank] = useState(0);
  const [toError, setToError] = useState(false);
  const [toDashboard, setToDashboard] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isStatHoliday, setIsStatHoliday] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [isAfterHourPublish, setIsAfterHourPublish] = useState(false);
  const [isConfirmation, setIsConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);
  const linksRef = useRef([]);
  const advisoryDateRef = useRef(moment().tz("America/Vancouver").toDate());
  const [advisoryId, setAdvisoryId] = useState();
  const [isApprover, setIsApprover] = useState(false);
  const [formError, setFormError] = useState("");

  const { hasAnyRole } = useAccess();
  const { getUserAdvisoryRole } = useAdvisoryRole();
  const {
    calculateIsStatHoliday,
    cmsGet,
    cmsPost,
    cmsPut,
    getProtectedAreas,
    getRegions,
    getSections,
    getManagementAreas,
    getSites,
    getFireCentres,
    getFireZones,
    getNaturalResourceDistricts,
    getRecreationResources,
    getEventTypes,
    getAccessStatuses,
    getUrgencies,
    getAdvisoryStatuses,
    getLinkTypes,
    getBusinessHours,
    getStandardMessages,
  } = useCms();

  const auth = useAuth();
  const initialized = !auth.isLoading;
  const isAuthenticated = auth.isAuthenticated;

  // Use a route blocker to show a confirmation dialog when the user attempts to navigate away with unsaved changes
  const blocker = useBlocker(dataChanged);
  // Ref to track if the route blocker is currently active, to prevent multiple blocker flows from stacking if more navigation is attempted while the dialog is open
  const isBlockerActive = useRef(false);

  // AdvisoryForm registers its save-draft function here so the "Unsaved changes" dialog can call it
  const saveDraftHandlerRef = useRef(null);

  // Callback for AdvisoryForm to register its save-draft handler function, so the "Unsaved changes" dialog can call it
  const registerSaveDraftHandler = useCallback((handler) => {
    saveDraftHandlerRef.current = handler;
  }, []);

  // Calls the registered save-draft handler from the AdvisoryForm and returns whether the save was successful.
  // Saving can fail due to network errors, or validation errors in the form data.
  // On success, proceed with navigation. On failure, stay on the form.
  const saveDraftFromForm = useCallback(async () => {
    const saveDraftHandler = saveDraftHandlerRef.current;

    if (!saveDraftHandler) {
      return false;
    }

    return Boolean(await saveDraftHandler());
  }, []);

  // Use the custom hook to manage the "Unsaved changes" dialog and get the function to trigger it,
  // along with the props for the dialog component
  const {
    confirmNavigation: confirmUnsavedChangesNavigation,
    props: unsavedChangesDialogProps,
  } = useUnsavedChangesDialog(saveDraftFromForm);

  // Set dataChanged to true when any of the form fields change, to enable the navigation guard
  const markChanged = useCallback(() => {
    setDataChanged(true);
  }, []);

  useNavigationGuard(dataChanged);

  // Block internal route transitions while there are unsaved changes.
  // beforeunload is still handled by useNavigationGuard for browser-level exits.
  useEffect(() => {
    if (blocker.state !== "blocked" || isBlockerActive.current) {
      return;
    }

    // Lock this blocked transition until the router confirms it has been
    // resolved so we do not start a second prompt flow for the same attempt.
    isBlockerActive.current = true;

    (async () => {
      // Wait for the user's choice in the "Unsaved changes" dialog and proceed with navigation accordingly
      const shouldProceed = await confirmUnsavedChangesNavigation();

      if (shouldProceed) {
        setDataChanged(false);
        blocker.proceed();
        return;
      }

      if (blocker.state === "blocked") {
        blocker.reset();
      }
    })();
  }, [blocker, confirmUnsavedChangesNavigation]);

  // Keep the blocked-navigation lock until the router confirms the transition is unblocked.
  // This prevents a second modal from opening on the same blocked navigation attempt.
  useEffect(() => {
    if (blocker.state === "unblocked") {
      isBlockerActive.current = false;
    }
  }, [blocker.state]);

  // In "update" mode, track when the original data from the CMS is loaded
  // to prevent re-fetching
  const originalDataLoaded = useRef(false);

  const { documentId } = useParams();

  const query = qs.stringify(
    {
      populate: {
        accessStatus: { populate: "*" },
        advisoryStatus: { populate: "*" },
        eventType: { populate: "*" },
        fireCentres: { fields: ["id"] },
        fireZones: { fields: ["id"] },
        naturalResourceDistricts: { fields: ["id"] },
        recreationResources: { fields: ["id"] },
        links: {
          populate: { type: { populate: "*" }, file: { populate: "*" } },
        },
        urgency: { populate: "*" },
        managementAreas: { fields: ["id"] },
        protectedAreas: { fields: ["id"] },
        regions: { fields: ["id"] },
        sections: { fields: ["id"] },
        sites: { fields: ["id"] },
        standardMessages: { populate: "*" },
      },
    },
    {
      encodeValuesOnly: true,
    },
  );

  // Reset originalDataLoaded to false when documentId or mode changes
  // when navigating to a different advisory or changing editing modes
  useEffect(() => {
    originalDataLoaded.current = false;
  }, [documentId, mode]);

  useEffect(() => {
    if (initialized && isAuthenticated) {
      Promise.resolve(getBusinessHours()).then((res) => {
        setIsAfterHours(calculateAfterHours(res));
      });
      calculateIsStatHoliday(setIsStatHoliday);
    }
  }, [isAuthenticated, initialized, calculateIsStatHoliday, getBusinessHours]);

  function setLinkIds() {
    const linkIds = [];

    linksRef.current.forEach((l) => {
      if (l.id) {
        linkIds.push(l.id);
      }
    });
    setLinks(linkIds);
  }

  useEffect(() => {
    if (mode === "update" && !isLoadingData && !originalDataLoaded.current) {
      if (documentId) {
        setAdvisoryId(documentId);
        cmsGet(`public-advisory-audits/${documentId}?${query}`)
          .then((advisoryData) => {
            linksRef.current = [];

            setRevisionNumber(advisoryData.revisionNumber);
            setHeadline(advisoryData.title || "");
            setDescription(advisoryData.description || "");
            if (advisoryData.isSafetyRelated) {
              setIsSafetyRelated(advisoryData.isSafetyRelated);
            }
            setListingRank(
              advisoryData.listingRank ? advisoryData.listingRank : 0,
            );
            setNotes(advisoryData.note || "");
            setSubmittedByName(advisoryData.submittedByName || "");
            if (advisoryData.advisoryDate) {
              setAdvisoryDate(
                moment(advisoryData.advisoryDate)
                  .tz("America/Vancouver")
                  .toDate(),
              );
              advisoryDateRef.current = moment(advisoryData.advisoryDate)
                .tz("America/Vancouver")
                .toDate();
            }
            if (advisoryData.effectiveDate) {
              setStartDate(
                moment(advisoryData.effectiveDate)
                  .tz("America/Vancouver")
                  .toDate(),
              );
            }
            if (advisoryData.endDate) {
              setEndDate(
                moment(advisoryData.endDate).tz("America/Vancouver").toDate(),
              );
            }

            if (advisoryData.expiryDate) {
              setExpiryDate(
                moment(advisoryData.expiryDate)
                  .tz("America/Vancouver")
                  .toDate(),
              );
            }
            if (advisoryData.updatedDate) {
              setUpdatedDate(
                moment(advisoryData.updatedDate)
                  .tz("America/Vancouver")
                  .toDate(),
              );
            }
            if (advisoryData.accessStatus) {
              setAccessStatus(advisoryData.accessStatus.documentId);
            }
            if (advisoryData.eventType) {
              setEventType(advisoryData.eventType.documentId);
            }
            if (advisoryData.urgency) {
              setUrgency(advisoryData.urgency.documentId);
            }
            if (advisoryData.advisoryStatus) {
              setAdvisoryStatus(advisoryData.advisoryStatus);
            }
            setDisplayAdvisoryDate(
              advisoryData.isAdvisoryDateDisplayed
                ? advisoryData.isAdvisoryDateDisplayed
                : false,
            );
            setDisplayStartDate(
              advisoryData.isEffectiveDateDisplayed
                ? advisoryData.isEffectiveDateDisplayed
                : false,
            );
            setDisplayEndDate(
              advisoryData.isEndDateDisplayed
                ? advisoryData.isEndDateDisplayed
                : false,
            );
            if (advisoryData.isUpdatedDateDisplayed !== null) {
              setDisplayUpdatedDate(advisoryData.isUpdatedDateDisplayed);
            }

            const standardMessageInfo = advisoryData.standardMessages;
            const protectedAreaInfo = advisoryData.protectedAreas;
            const regionInfo = advisoryData.regions;
            const sectionInfo = advisoryData.sections;
            const managementAreaInfo = advisoryData.managementAreas;
            const siteInfo = advisoryData.sites;
            const fireCentreInfo = advisoryData.fireCentres;
            const fireZoneInfo = advisoryData.fireZones;
            const naturalResourceDistrictInfo =
              advisoryData.naturalResourceDistricts;
            const recreationResourceInfo = advisoryData.recreationResources;

            if (standardMessageInfo) {
              const selStandardMessages = [];

              standardMessageInfo.forEach((p) => {
                selStandardMessages.push(
                  standardMessages.find((l) => l.value === p.documentId),
                );
              });
              setSelectedStandardMessages([...selStandardMessages]);
            }

            if (protectedAreaInfo) {
              const selProtectedAreas = [];

              protectedAreaInfo.forEach((p) => {
                selProtectedAreas.push(
                  protectedAreas.find((l) => l.value === p.documentId),
                );
              });
              setSelectedProtectedAreas([...selProtectedAreas]);
            }
            if (regionInfo) {
              const selRegions = [];

              regionInfo.forEach((r) => {
                selRegions.push(regions.find((l) => l.value === r.documentId));
              });
              setSelectedRegions([...selRegions]);
            }
            if (sectionInfo) {
              const selSections = [];

              sectionInfo.forEach((s) => {
                selSections.push(
                  sections.find((l) => l.value === s.documentId),
                );
              });
              setSelectedSections([...selSections]);
            }
            if (managementAreaInfo) {
              const selManagementAreas = [];

              managementAreaInfo.forEach((m) => {
                selManagementAreas.push(
                  managementAreas.find((l) => l.value === m.documentId),
                );
              });
              setSelectedManagementAreas([...selManagementAreas]);
            }
            if (siteInfo) {
              const selSites = [];

              siteInfo.forEach((s) => {
                selSites.push(sites.find((l) => l.value === s.documentId));
              });
              setSelectedSites([...selSites]);
            }
            if (fireCentreInfo) {
              const selFireCentres = [];

              fireCentreInfo.forEach((f) => {
                selFireCentres.push(
                  fireCentres.find((l) => l.value === f.documentId),
                );
              });
              setSelectedFireCentres([...selFireCentres]);
            }
            if (fireZoneInfo) {
              const selFireZones = [];

              fireZoneInfo.forEach((f) => {
                selFireZones.push(
                  fireZones.find((l) => l.value === f.documentId),
                );
              });
              setSelectedFireZones([...selFireZones]);
            }
            if (naturalResourceDistrictInfo) {
              const selNaturalResourceDistricts = [];

              naturalResourceDistrictInfo.forEach((f) => {
                selNaturalResourceDistricts.push(
                  naturalResourceDistricts.find(
                    (l) => l.value === f.documentId,
                  ),
                );
              });
              setSelectedNaturalResourceDistricts([
                ...selNaturalResourceDistricts,
              ]);
            }
            if (recreationResourceInfo) {
              const selRecreationResources = recreationResourceInfo
                .map((resource) =>
                  recreationResources.find(
                    (option) => option.value === resource.documentId,
                  ),
                )
                .filter(Boolean);

              setSelectedRecreationResources([...selRecreationResources]);
            }
            const advisoryLinks = advisoryData.links;

            if (advisoryLinks.length > 0) {
              advisoryLinks.forEach((l) => {
                linksRef.current = [
                  ...linksRef.current,
                  {
                    type: l.type.documentId,
                    title: l.title || "",
                    url: l.url || "",
                    id: l.documentId,
                    file: l.file || "",
                    format: l.format || "",
                    isModified: false,
                    isFileModified: false,
                  },
                ];
              });
            }
            setLinkIds();
            setIsLoadingPage(false);
            originalDataLoaded.current = true;
          })
          .catch((error) => {
            console.error(
              "error occurred fetching Public Advisory data",
              error,
            );
            setToError(true);
            setError({
              status: 500,
              message: "Error fetching advisory",
            });
            setIsLoadingPage(false);
          });
      } else {
        setToError(true);
        setError({
          status: 400,
          message: "Advisory Id is not found",
        });
        setIsLoadingPage(false);
      }
    }
  }, [
    documentId,
    query,
    mode,
    isLoadingData,
    setError,
    standardMessages,
    protectedAreas,
    regions,
    sections,
    managementAreas,
    sites,
    fireCentres,
    fireZones,
    naturalResourceDistricts,
    recreationResources,
    cmsGet,
  ]);

  useEffect(() => {
    if (initialized && isAuthenticated) {
      const approver = hasAnyRole([ROLES.ADVISORY_APPROVER]);

      setIsApprover(approver);
      Promise.all([
        getProtectedAreas(),
        getRegions(),
        getSections(),
        getManagementAreas(),
        getSites(),
        getFireCentres(),
        getFireZones(),
        getNaturalResourceDistricts(),
        getRecreationResources(),
        getEventTypes(),
        getAccessStatuses(),
        getUrgencies(),
        getAdvisoryStatuses(),
        getLinkTypes(),
        getStandardMessages(),
      ])
        .then((res) => {
          const protectedAreaData = res[0];
          const newProtectedAreas = protectedAreaData.map((p) => ({
            label: p.protectedAreaName,
            value: p.documentId,
            type: "protectedArea",
            orcs: p.orcs,
          }));

          setProtectedAreas([...newProtectedAreas]);
          const regionData = res[1];
          const newRegions = regionData.map((r) => ({
            label: `${r.regionName} Region`,
            value: r.documentId,
            type: "region",
            obj: r,
          }));

          setRegions([...newRegions]);
          const sectionData = res[2];
          const newSections = sectionData.map((s) => ({
            label: `${s.sectionName} Section`,
            value: s.documentId,
            type: "section",
            obj: s,
          }));

          setSections([...newSections]);
          const managementAreaData = res[3];
          const newManagementAreas = managementAreaData.map((m) => ({
            label: `${m.managementAreaName} Management Area`,
            value: m.documentId,
            type: "managementArea",
            obj: m,
          }));

          setManagementAreas([...newManagementAreas]);
          const siteData = res[4];
          const newSites = siteData.map((s) => ({
            label: `${s?.protectedArea?.protectedAreaName}: ${s.siteName}`,
            value: s.documentId,
            type: "site",
            obj: s,
          }));

          newSites.sort(labelCompare);
          setSites([...newSites]);
          const fireCentreData = res[5];
          const newFireCentres = fireCentreData.map((f) => ({
            label: f.fireCentreName,
            value: f.documentId,
            type: "fireCentre",
            obj: f,
          }));

          setFireCentres([...newFireCentres]);
          const fireZoneData = res[6];
          const newFireZones = fireZoneData.map((f) => ({
            label: f.fireZoneName,
            value: f.documentId,
            type: "fireZone",
            obj: f,
          }));

          setFireZones([...newFireZones]);
          const naturalResourceDistrictData = res[7];
          const newNaturalResourceDistricts = naturalResourceDistrictData.map(
            (f) => ({
              label: f.naturalResourceDistrictName,
              value: f.documentId,
              type: "naturalResourceDistrict",
              obj: f,
            }),
          );

          setNaturalResourceDistricts([...newNaturalResourceDistricts]);
          const recreationResourceData = res[8];
          const newRecreationResources = recreationResourceData.map(
            (resource) => ({
              label: `${resource.resourceName} (${resource.recResourceId})`,
              value: resource.documentId,
              type: "recreationResource",
              obj: resource,
            }),
          );

          setRecreationResources(newRecreationResources);
          const eventTypeData = res[9];
          const newEventTypes = eventTypeData.map((et) => ({
            label: et.eventType,
            value: et.documentId,
            category: et.groupLabel,
            scope: et.scope,
          }));

          setEventTypes([...newEventTypes]);
          const accessStatusData = res[10];

          const newAccessStatuses = accessStatusData.map((a) => ({
            label: a.accessStatus,
            value: a.documentId,
            category: a.groupLabel,
            scope: a.scope,
          }));

          // Default to "Open" access status for non-RST users
          setAccessStatuses([...newAccessStatuses]);
          const openAccessStatus = newAccessStatuses.find(
            (a) => a.label === "Open",
          );

          // Do not pre select access status for RST users
          const isRecreationUser = hasAnyRole([ROLES.RECREATION_USER]);

          if (!isRecreationUser && openAccessStatus) {
            setAccessStatus(openAccessStatus.value);
          }
          const urgencyData = res[11];
          const newUrgencies = urgencyData.map((u) => ({
            label: u.urgency,
            value: u.documentId,
            sequence: u.sequence,
          }));

          setUrgencies([...newUrgencies]);
          const advisoryStatusData = res[12];
          const restrictedAdvisoryStatusCodes = new Set(["UNP", "SCH"]);
          const desiredOrder = ["PUB", "UNP", "DFT", "SCH", "HQR"];
          const tempAdvisoryStatuses = advisoryStatusData.map((s) => {
            const isAllowedStatus =
              approver || !restrictedAdvisoryStatusCodes.has(s.code);

            if (!isAllowedStatus) return null;

            return {
              code: s.code,
              advisoryStatus: s.advisoryStatus,
              documentId: s.documentId,
            };
          });
          const filteredStatuses = tempAdvisoryStatuses.filter(
            (s) => s !== null,
          );
          const sortedStatus = filteredStatuses.sort(
            (a, b) =>
              desiredOrder.indexOf(a.code) - desiredOrder.indexOf(b.code),
          );

          setAdvisoryStatuses([...sortedStatus]);
          const linkTypeData = res[13];
          const newLinkTypes = linkTypeData.map((lt) => ({
            label: lt.type,
            value: lt.documentId,
          }));

          setLinkTypes([...newLinkTypes]);
          const standardMessageData = res[14];
          const newStandardMessages = standardMessageData.map((m) => ({
            label: m.title,
            value: m.documentId,
            type: "standardMessage",
            obj: m,
          }));

          setStandardMessages([...newStandardMessages]);
          if (mode === "create") {
            const defaultUrgency = newUrgencies.filter(
              (u) => u.label === "Low",
            );

            if (defaultUrgency.length > 0) {
              setUrgency(defaultUrgency[0].value);
            }
            setIsLoadingPage(false);
          }

          setSubmitter(auth.user?.profile?.name);
          setIsLoadingData(false);
        })
        .catch((error) => {
          console.error("error occurred fetching dropdown data?", error);

          setToError(true);
          setError({
            status: 500,
            message: "Error occurred",
          });
          setIsLoadingData(false);
          setIsLoadingPage(false);
        });
    }
  }, [
    setError,
    isAuthenticated,
    initialized,
    auth.user?.profile?.name,
    mode,
    hasAnyRole,
    getProtectedAreas,
    getRegions,
    getSections,
    getManagementAreas,
    getSites,
    getFireCentres,
    getFireZones,
    getNaturalResourceDistricts,
    getRecreationResources,
    getEventTypes,
    getAccessStatuses,
    getUrgencies,
    getAdvisoryStatuses,
    getLinkTypes,
    getStandardMessages,
  ]);

  async function setToBack() {
    if (dataChanged) {
      // Show the "Unsaved changes" dialog and wait for the user's response before navigating back
      const shouldProceed = await confirmUnsavedChangesNavigation();

      if (!shouldProceed) {
        return;
      }

      setDataChanged(false);
    }

    if (mode === "update" && fromSummary) {
      setIsConfirmation(true);
    } else {
      setToDashboard(true);
    }
  }

  function handleAdvisoryDateChange(e) {
    setAdvisoryDate(e);
    advisoryDateRef.current = e;
  }

  function addLink(format) {
    linksRef.current = [...linksRef.current, { title: "", url: "", format }];
    setLinkIds();
  }

  function updateLink(index, field, value) {
    const tempLinks = [...linksRef.current];

    tempLinks[index][field] = value;
    tempLinks[index].isModified = true;
    linksRef.current = [...tempLinks];
    setLinkIds();
  }

  function removeLink(index) {
    const tempLinks = linksRef.current.filter((link, idx) => idx !== index);

    linksRef.current = [...tempLinks];
    setLinkIds();
  }

  function handleFileCapture(files, index) {
    const tempLinks = [...linksRef.current];

    tempLinks[index].file = files[0];
    tempLinks[index].isFileModified = true;
    linksRef.current = [...tempLinks];
    setLinkIds();
  }

  function isValidLink(link) {
    if (
      (link.title !== "" && link.url !== "" && link.isModified) ||
      (link.file && link.isFileModified)
    ) {
      return true;
    }
    return false;
  }

  async function preSaveMediaLink(link) {
    const linkRequest = {
      data: {
        type: link.type,
        title: link.title,
      },
    };
    const res = await cmsPost(`links`, linkRequest).catch((error) => {
      console.error("error occurred", error);
      setToError(true);
      setError({
        status: 500,
        message: "Could not save attachments",
      });
      return null;
    });

    if (!res) return null;

    return res.documentId;
  }

  async function uploadMedia(id, file) {
    const data = {};
    const fileForm = new FormData();

    data.refId = id;
    data.ref = "link";
    data.field = "file";
    fileForm.append("files", file);
    fileForm.append("data", JSON.stringify(data));

    const res = await cmsPost(`upload`, fileForm, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }).catch((error) => {
      console.error("error occurred", error);
      setToError(true);
      setError({
        status: 500,
        message: "Could not save attachments",
      });
      return null;
    });

    if (!res) return null;

    if (res.length > 0) {
      return res[0];
    }
    setToError(true);
    setError({
      status: 500,
      message: "Could not save attachments",
    });

    return null;
  }

  async function updateMediaLink(media, id, link) {
    const isProtocolExist = /(https|http?)/giu;

    const path = media.url?.match(isProtocolExist);
    const getUrl = path?.length
      ? media.url
      : getEnv("VITE_CMS_BASE_URL") + media.url;

    const linkRequest = {
      data: {
        title: link.title ? link.title : media.name,
        type: link.type,
        url: getUrl,
      },
    };

    const res = await cmsPut(`links/${id}`, linkRequest).catch((error) => {
      console.error("error occurred", error);
      setToError(true);
      setError({
        status: 500,
        message: "Could not save attachments",
      });
      return null;
    });

    if (!res) return null;

    return res;
  }

  async function saveMediaAttachment(id, link) {
    const mediaResponse = await uploadMedia(id, link.file);

    if (!mediaResponse) return null;

    const updateLinkResponse = await updateMediaLink(mediaResponse, id, link);

    return updateLinkResponse;
  }

  async function createLink(link) {
    if (link.isFileModified) {
      const id = await preSaveMediaLink(link);

      if (!id) return null;

      const res = await saveMediaAttachment(id, link);

      return res;
    }
    const linkRequest = {
      data: {
        title: link.title,
        url: link.url.startsWith("http") ? link.url : `https://${link.url}`,
        type: link.type,
      },
    };
    const res = await cmsPost(`links`, linkRequest).catch((error) => {
      console.error("error occurred", error);
      setToError(true);
      setError({
        status: 500,
        message: "Could not process advisory update",
      });
      return null;
    });

    if (!res) return null;

    return res;
  }

  async function saveLink(link, id) {
    if (link.isFileModified) {
      const res = await saveMediaAttachment(id, link);

      return res;
    }
    const linkRequest = {
      data: {
        title: link.title,
        url: link.url.startsWith("http") ? link.url : `https://${link.url}`,
        type: link.type,
      },
    };
    const res = await cmsPut(`links/${id}`, linkRequest).catch((error) => {
      console.error("error occurred", error);
      setToError(true);
      setError({
        status: 500,
        message: "Could not process advisory update",
      });
      return null;
    });

    if (!res) return null;

    return res;
  }

  async function saveLinks() {
    const savedLinks = [];

    for (const link of linksRef.current) {
      if (isValidLink(link)) {
        if (link.id) {
          const savedLink = await saveLink(link, link.id);

          if (savedLink) savedLinks.push(savedLink.documentId);
        } else {
          const savedLink = await createLink(link);

          if (savedLink) savedLinks.push(savedLink.documentId);
        }
      }
    }
    return savedLinks;
  }

  /**
   * Sets the confirmation text to display on the Advisory summary page after form submission.
   * @param {string} statusCode the advisory-status code of the form submission
   * @returns {void}
   */
  function setConfirmationTextForStatus(statusCode) {
    switch (statusCode) {
      case "DFT":
        setConfirmationText("Your advisory has been saved successfully!");
        break;
      case "PUB":
        setConfirmationText("Your advisory has been published successfully!");
        break;
      default:
        setConfirmationText("Your advisory has been saved successfully!");
    }
  }

  /**
   * Creates a new advisory in the CMS with the given status.
   * @param {Object} status advisory-status document from the CMS
   * @param {string} status.code the code of the advisory-status to check
   * @param {string} status.documentId the documentId of the advisory-status to set for the advisory
   * @returns {Promise<Object|null>} the saved advisory document, or null if the save fails
   */
  async function createAdvisory(status) {
    try {
      // Set loading status based on status code
      if (status.code === "DFT") {
        setIsSavingDraft(true);
      } else {
        setIsSubmitting(true);
      }

      const selProtectedAreas = selectedProtectedAreas.map((x) => x.value);
      const selRegions = selectedRegions.map((x) => x.value);
      const selSections = selectedSections.map((x) => x.value);
      const selManagementAreas = selectedManagementAreas.map((x) => x.value);
      const selSites = selectedSites.map((x) => x.value);
      const selFireCentres = selectedFireCentres.map((x) => x.value);
      const selFireZones = selectedFireZones.map((x) => x.value);
      const selNaturalResourceDistricts = selectedNaturalResourceDistricts.map(
        (x) => x.value,
      );
      const selRecreationResources = selectedRecreationResources.map(
        (x) => x.value,
      );

      const savedLinks = await saveLinks();
      const newAdvisory = {
        title: headline,
        description,
        revisionNumber: null, // Create a new record with no revision number
        isSafetyRelated,
        listingRank: listingRank ? Number.parseInt(listingRank, 10) : 0,
        note: notes,
        submittedByName: submittedByName ? submittedByName : submitter,
        createdDate: moment().toISOString(),
        modifiedDate: moment().toISOString(),
        advisoryDate,
        effectiveDate: startDate,
        endDate,
        expiryDate,
        accessStatus: accessStatus ? accessStatus : null,
        eventType,
        urgency,
        standardMessages: selectedStandardMessages.map((s) => s.value),
        protectedAreas: selProtectedAreas,
        advisoryStatus: status.documentId,
        links: savedLinks,
        regions: selRegions,
        sections: selSections,
        managementAreas: selManagementAreas,
        sites: selSites,
        fireCentres: selFireCentres,
        fireZones: selFireZones,
        naturalResourceDistricts: selNaturalResourceDistricts,
        recreationResources: selRecreationResources,
        isAdvisoryDateDisplayed: displayAdvisoryDate,
        isEffectiveDateDisplayed: displayStartDate,
        isEndDateDisplayed: displayEndDate,
        isLatestRevision: true,
        createdByName: auth.user?.profile?.name,
        createdByEmail: auth.user?.profile?.email,
        reviewedByName: null,
        reviewedDate: null,
        createdByRole: getUserAdvisoryRole(),
        isUrgentAfterHours:
          !isApprover && (isAfterHours || isStatHoliday) && isAfterHourPublish,
      };

      // Add the publishing info
      if (status.code === "PUB") {
        newAdvisory.publishedByName = auth.user?.profile?.name;
        newAdvisory.publishedDate = moment().toISOString();
      }

      // Add the reviewer name and review date if the user is approving an advisory
      if (isApprover && (status.code === "PUB" || status.code === "SCH")) {
        newAdvisory.reviewedByName = auth.user?.profile?.name;
        newAdvisory.reviewedDate = moment().toISOString();
      }

      const advisory = await cmsPost(`public-advisory-audits`, {
        data: newAdvisory,
      });

      setAdvisoryId(advisory.documentId);
      setDataChanged(false);
      setIsSubmitting(false);
      setIsSavingDraft(false);
      setConfirmationTextForStatus(status.code);
      setIsConfirmation(true);
      return advisory;
    } catch (error) {
      console.error("error occurred", error);
      setToError(true);
      setError({
        status: 500,
        message: "Could not process advisory update",
      });
      return null;
    }
  }

  /**
   * Updates advisory details in the CMS, and sets the status to the given status value.
   * @param {Object} status advisory-status document from the CMS
   * @param {string} status.code the code of the advisory-status to check
   * @param {string} status.documentId the documentId of the advisory-status to set for the advisory
   * @returns {Promise<Object|null>} the updated advisory document, or null if the save fails
   */
  async function updateAdvisory(status) {
    try {
      // Set loading status based on status code
      if (status.code === "DFT") {
        setIsSavingDraft(true);
      } else {
        setIsSubmitting(true);
      }

      const selProtectedAreas = selectedProtectedAreas.map((x) => x.value);
      const selRegions = selectedRegions.map((x) => x.value);
      const selSections = selectedSections.map((x) => x.value);
      const selManagementAreas = selectedManagementAreas.map((x) => x.value);
      const selSites = selectedSites.map((x) => x.value);
      const selFireCentres = selectedFireCentres.map((x) => x.value);
      const selFireZones = selectedFireZones.map((x) => x.value);
      const selNaturalResourceDistricts = selectedNaturalResourceDistricts.map(
        (x) => x.value,
      );
      const selRecreationResources = selectedRecreationResources.map(
        (x) => x.value,
      );

      const savedLinks = await saveLinks();
      const updatedLinks =
        savedLinks.length > 0 ? [...links, ...savedLinks] : links;
      const updatedAdvisory = {
        title: headline,
        description,
        revisionNumber,
        isSafetyRelated,
        listingRank: listingRank ? Number.parseInt(listingRank, 10) : 0,
        note: notes,
        submittedByName,
        updatedDate,
        modifiedDate: moment().toISOString(),
        modifiedByName: auth.user?.profile?.name,
        modifiedByRole: getUserAdvisoryRole(),
        advisoryDate,
        effectiveDate: startDate,
        endDate,
        expiryDate,
        accessStatus,
        eventType,
        urgency,
        standardMessages: selectedStandardMessages.map((s) => s.value),
        protectedAreas: selProtectedAreas,
        advisoryStatus: status.documentId,
        links: updatedLinks,
        regions: selRegions,
        sections: selSections,
        managementAreas: selManagementAreas,
        sites: selSites,
        fireCentres: selFireCentres,
        fireZones: selFireZones,
        naturalResourceDistricts: selNaturalResourceDistricts,
        recreationResources: selRecreationResources,
        isAdvisoryDateDisplayed: displayAdvisoryDate,
        isEffectiveDateDisplayed: displayStartDate,
        isEndDateDisplayed: displayEndDate,
        isUpdatedDateDisplayed: displayUpdatedDate,
        isLatestRevision: true,
        reviewedByName: null,
        reviewedDate: null,
      };

      // Record the publishing info and clear the unpublishing info
      if (status.code === "PUB") {
        updatedAdvisory.publishedByName = auth.user?.profile?.name;
        updatedAdvisory.publishedDate = moment().toISOString();
      }

      // Clear the unpublished info if the advisory is being moved to any other
      // status. The unpublished info will be preserved on the previous revision.
      if (status.code !== "UNP") {
        updatedAdvisory.unpublishedDate = null;
        updatedAdvisory.unpublishedByName = null;
      }

      // Add the reviewer name and review date if the user is approving an advisory
      if (isApprover && (status.code === "PUB" || status.code === "SCH")) {
        updatedAdvisory.reviewedByName = auth.user?.profile?.name;
        updatedAdvisory.reviewedDate = moment().toISOString();
      }

      if (
        !isApprover &&
        (isAfterHours || isStatHoliday) &&
        isAfterHourPublish
      ) {
        updatedAdvisory.isUrgentAfterHours = true;
      }

      const advisory = await cmsPut(`public-advisory-audits/${documentId}`, {
        data: updatedAdvisory,
      });

      setAdvisoryId(advisory.documentId);
      setDataChanged(false);
      setIsSubmitting(false);
      setIsSavingDraft(false);
      setConfirmationTextForStatus(status.code);
      setIsConfirmation(true);
      return advisory;
    } catch (error) {
      console.error("error occurred", error);
      setToError(true);
      setError({
        status: 500,
        message: "Could not process advisory update",
      });
      return null;
    }
  }

  if (toDashboard) {
    const dashboardPath =
      tabParam === "review"
        ? "/advisories-and-closures/review"
        : "/advisories-and-closures";

    return (
      <Navigate
        push
        to={{
          pathname: dashboardPath,
          index: 0,
        }}
      />
    );
  }

  if (toError) {
    return <Navigate to="/error" />;
  }

  if (isConfirmation) {
    const summaryUrl = `/advisory-summary/${advisoryId}`;
    const finalUrl =
      tabParam === "review" ? `${summaryUrl}?tab=review` : summaryUrl;

    return <Navigate to={finalUrl} state={{ confirmationText }} />;
  }

  return (
    <main className="advisories-styles">
      <div className="Advisory" data-testid="Advisory">
        <div className="container">
          {isLoadingPage && (
            <div className="page-loader">
              <Loader page />
            </div>
          )}
          {!isLoadingPage && (
            <>
              <div>
                <button
                  type="button"
                  className="btn btn-link btn-back mt-4"
                  onClick={setToBack}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="me-1" />
                  Back to{" "}
                  {mode === "update" && fromSummary
                    ? "advisory / closure preview"
                    : "advisories and closures dashboard"}
                </button>
                <h2 className="mt-5 mb-0">
                  {mode === "create" ? "Create" : "Edit"} advisory / closure
                </h2>
                <p>
                  <small className="small-text">
                    <span className="required">*</span> indicates a required
                    field
                  </small>
                </p>
                <p>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://intranet.gov.bc.ca/env/card/prp/voss/information-services/staff-portal/create-advisory"
                  >
                    View guide for creating an advisory / closure
                  </a>
                </p>
              </div>
              <AdvisoryForm
                mode={mode}
                markChanged={markChanged}
                registerSaveDraftHandler={registerSaveDraftHandler}
                data={{
                  listingRank,
                  setListingRank,
                  headline,
                  setHeadline,
                  eventType,
                  eventTypes,
                  setEventType,
                  accessStatus,
                  accessStatuses,
                  setAccessStatus,
                  description,
                  setDescription,
                  standardMessages,
                  selectedStandardMessages,
                  setSelectedStandardMessages,
                  recreationResources,
                  selectedRecreationResources,
                  setSelectedRecreationResources,
                  protectedAreas,
                  selectedProtectedAreas,
                  setSelectedProtectedAreas,
                  regions,
                  selectedRegions,
                  setSelectedRegions,
                  sections,
                  selectedSections,
                  setSelectedSections,
                  managementAreas,
                  selectedManagementAreas,
                  setSelectedManagementAreas,
                  sites,
                  selectedSites,
                  setSelectedSites,
                  fireCentres,
                  selectedFireCentres,
                  setSelectedFireCentres,
                  fireZones,
                  selectedFireZones,
                  setSelectedFireZones,
                  naturalResourceDistricts,
                  selectedNaturalResourceDistricts,
                  setSelectedNaturalResourceDistricts,
                  urgencies,
                  urgency,
                  setUrgency,
                  isSafetyRelated,
                  setIsSafetyRelated,
                  advisoryDate,
                  handleAdvisoryDateChange,
                  displayAdvisoryDate,
                  setDisplayAdvisoryDate,
                  startDate,
                  setStartDate,
                  displayStartDate,
                  setDisplayStartDate,
                  endDate,
                  setEndDate,
                  displayEndDate,
                  setDisplayEndDate,
                  updatedDate,
                  setUpdatedDate,
                  displayUpdatedDate,
                  setDisplayUpdatedDate,
                  expiryDate,
                  setExpiryDate,
                  linksRef,
                  linkTypes,
                  removeLink,
                  updateLink,
                  addLink,
                  handleFileCapture,
                  isApprover,
                  notes,
                  setNotes,
                  submittedByName,
                  setSubmittedByName,
                  advisoryStatuses,
                  advisoryStatus,
                  setAdvisoryStatus,
                  isStatHoliday,
                  isAfterHours,
                  isAfterHourPublish,
                  setIsAfterHourPublish,
                  createAdvisory,
                  isSubmitting,
                  isSavingDraft,
                  updateAdvisory,
                  formError,
                  setFormError,
                }}
              />

              <UnsavedChangesDialog {...unsavedChangesDialogProps}>
                <p>
                  Changes for this advisory / closure will be permanently
                  deleted if you do not save them.
                </p>
              </UnsavedChangesDialog>
            </>
          )}
        </div>
        <br />
      </div>
    </main>
  );
}

Advisory.propTypes = {
  mode: PropTypes.string.isRequired,
  page: PropTypes.shape({
    setError: PropTypes.func.isRequired,
    cmsData: PropTypes.object.isRequired,
    setCmsData: PropTypes.func.isRequired,
  }).isRequired,
};
