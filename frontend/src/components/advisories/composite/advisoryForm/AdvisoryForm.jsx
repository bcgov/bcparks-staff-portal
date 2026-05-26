import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { useTranslation } from "react-i18next";
import "./AdvisoryForm.scss";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Btn from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faClock,
  faXmark,
} from "@fa-kit/icons/classic/regular";
import {
  faCheck,
  faChevronDown,
  faChevronUp,
  faCircleQuestion,
  faTriangleExclamation,
} from "@fa-kit/icons/classic/solid";
import Select from "react-select";
import {
  validateOptionalNumber,
  validateRequiredText,
  validateRequiredSelect,
  validateRequiredDate,
  validateOptionalDate,
  validAdvisoryData,
  validateLink,
  validateDisplayedDate,
} from "@/lib/advisories/validators/AdvisoryValidator";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import useAccess from "@/hooks/useAccess";
import { ROLES } from "@/config/permissions";
import LightTooltip from "@/components/advisories/shared/tooltip/LightTooltip";
import AdvisoryAreaPicker from "@/components/advisories/composite/advisoryAreaPicker/AdvisoryAreaPicker";
import CKEditor from "@/components/advisories/composite/ckeditor/CKEditor";
import PrimaryActions from "@/components/advisories/composite/advisoryForm/PrimaryActions";
import DraftButton from "@/components/advisories/composite/advisoryForm/DraftButton";

export default function AdvisoryForm({
  mode,
  data: {
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
    submittedBy,
    setSubmittedBy,
    advisoryStatuses,
    advisoryStatusCode,
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
  },
}) {
  const { t } = useTranslation("act");
  const { hasAnyRole } = useAccess();

  const [showEventDates, setShowEventDates] = useState(false);
  // Track if hidden fields have been expanded once (to prevent auto-expanding it if the user manually closes it
  const autoExpandedEventDates = useRef(false);
  const [affectedResourceError, setAffectedResourceError] = useState("");
  const [eventTypeError, setEventTypeError] = useState("");
  const [urgencyError, setUrgencyError] = useState("");
  const [advisoryStatusError, setAdvisoryStatusError] = useState("");
  const [headlineError, setHeadlineError] = useState("");
  const [advisoryDateError, setAdvisoryDateError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [expiryDateError, setExpiryDateError] = useState("");
  const [updatedDateError, setUpdatedDateError] = useState("");
  const [listingRankError, setListingRankError] = useState("");
  const [linkTypeErrors, setLinkTypeErrors] = useState(
    new Array(linksRef.current.length).fill(false),
  );
  const [linkTitleErrors, setLinkTitleErrors] = useState(
    new Array(linksRef.current.length).fill(false),
  );
  const [linkUrlErrors, setLinkUrlErrors] = useState(
    new Array(linksRef.current.length).fill(false),
  );
  const [linkFileErrors, setLinkFileErrors] = useState(
    new Array(linksRef.current.length).fill(false),
  );
  const [hasFileDeleted, setHasFileDeleted] = useState(
    new Array(linksRef.current.length).fill(false),
  );
  const [displayedDateError, setDisplayedDateError] = useState("");
  const [selectedDisplayedDateOption, setSelectedDisplayedDateOption] =
    useState("");

  // Reveal event dates in update mode if there are any
  useEffect(() => {
    if (
      mode === "update" &&
      autoExpandedEventDates.current === false &&
      showEventDates === false &&
      (startDate || endDate)
    ) {
      setShowEventDates(true);
      autoExpandedEventDates.current = true;
    } else if (showEventDates && !autoExpandedEventDates.current) {
      // Don't auto-expand the section after the initial load: set the flag to true to skip future checks
      autoExpandedEventDates.current = true;
    }
  }, [mode, showEventDates, startDate, endDate]);

  const advisoryData = {
    listingRank: {
      value: listingRank,
      setError: setListingRankError,
      text: "listing rank",
    },
    headline: { value: headline, setError: setHeadlineError, text: "headline" },
    eventType: {
      value: eventType,
      setError: setEventTypeError,
      text: "event type",
    },
    affectedResources: {
      // BC Parks Protected area and Recreation resource fields share a validation state:
      // One field or the other must have a value
      protectedAreaFields: [
        selectedProtectedAreas,
        selectedRegions,
        selectedSections,
        selectedManagementAreas,
        selectedFireCentres,
        selectedFireZones,
        selectedNaturalResourceDistricts,
        selectedSites,
      ],

      recreationResourcesFields: [selectedRecreationResources],

      setError: setAffectedResourceError,
      text: "Select at least one Recreation Sites and Trails recreation resource or BC Parks park",
    },
    urgency: { value: urgency, setError: setUrgencyError, text: "urgency" },
    advisoryDate: { value: advisoryDate, setError: setAdvisoryDateError },
    startDate: { value: startDate, setError: setStartDateError },
    endDate: { value: endDate, setError: setEndDateError },
    expiryDate: { value: expiryDate, setError: setExpiryDateError },
    updatedDate: { value: updatedDate, setError: setUpdatedDateError },
    advisoryStatus: {
      value: advisoryStatus,
      setError: setAdvisoryStatusError,
      text: "advisory status",
    },
    displayedDate: {
      value: {
        advisoryDate,
        startDate,
        endDate,
        expiryDate,
        updatedDate,
        displayedDateOption: selectedDisplayedDateOption,
      },
      setError: setDisplayedDateError,
    },
    formError: setFormError,
  };

  const linkErrorsStatus = {
    linkTypeErrors,
    linkTitleErrors,
    linkUrlErrors,
    linkFileErrors,
    setLinkTypeErrors,
    setLinkTitleErrors,
    setLinkUrlErrors,
    setLinkFileErrors,
  };

  const headlineInput = {
    id: "headline",
    required: true,
  };
  // const descriptionInput = {
  //   id: "description",
  //   required: false,
  // };
  const linkTitleInput = {
    id: "link",
    required: false,
  };
  const linkUrlInput = {
    id: "url",
    required: false,
  };
  const notesInput = {
    id: "notes",
    required: false,
  };

  const submitterInput = {
    id: "submitter",
    required: false,
  };

  const listingRankInput = {
    id: "listing",
    required: false,
  };

  const displayedDateOptions = [
    { label: "Posting date", value: "posting" },
    ...(mode === "update" ? [{ label: "Updated date", value: "updated" }] : []),
    { label: "Start date", value: "start" },
    { label: "Event date range", value: "event" },
    { label: "No date", value: "no" },
  ];

  const POSTING_DATE = 0;
  const UPDATED_DATE = 1;
  const START_DATE = 2;
  const EVENT_DATE_RANGE = 3;
  const NO_DATE = 4;

  function getDisplayedDate() {
    if (
      !displayStartDate &&
      !displayEndDate &&
      !displayAdvisoryDate &&
      !displayUpdatedDate
    ) {
      return displayedDateOptions[NO_DATE];
    }
    if (
      !displayStartDate &&
      !displayEndDate &&
      displayAdvisoryDate &&
      !displayUpdatedDate
    ) {
      return displayedDateOptions[POSTING_DATE];
    }
    if (
      !displayStartDate &&
      !displayEndDate &&
      !displayAdvisoryDate &&
      displayUpdatedDate
    ) {
      return displayedDateOptions[UPDATED_DATE];
    }
    if (
      displayStartDate &&
      !displayEndDate &&
      !displayAdvisoryDate &&
      !displayUpdatedDate
    ) {
      return displayedDateOptions[START_DATE];
    }
    if (
      displayStartDate &&
      displayEndDate &&
      !displayAdvisoryDate &&
      !displayUpdatedDate
    ) {
      return displayedDateOptions[EVENT_DATE_RANGE];
    }

    return null;
  }

  // Check if the URL format is a file
  function isFile(url) {
    const fileExtensions = [".jpg", ".jpeg", ".gif", ".png", ".pdf"];

    for (const extension of fileExtensions) {
      if (url.endsWith(extension)) {
        return true;
      }
    }
    return false;
  }

  function renderHelperText(text, isError = false, className = "") {
    if (!text) {
      return null;
    }

    return (
      <div
        className={`act-helper-text ${isError ? "text-danger" : ""} ${className}`.trim()}
      >
        {text}
      </div>
    );
  }

  function getControlClassName(error = false, className = "") {
    return `bcgov-input ${error ? "is-invalid" : ""} ${className}`.trim();
  }

  useEffect(() => {
    if (selectedDisplayedDateOption === "posting") {
      setDisplayAdvisoryDate(true);
      setDisplayUpdatedDate(false);
      setDisplayStartDate(false);
      setDisplayEndDate(false);
    }
    if (selectedDisplayedDateOption === "updated") {
      setDisplayAdvisoryDate(false);
      setDisplayUpdatedDate(true);
      setDisplayStartDate(false);
      setDisplayEndDate(false);
    }
    if (selectedDisplayedDateOption === "start") {
      setDisplayAdvisoryDate(false);
      setDisplayUpdatedDate(false);
      setDisplayStartDate(true);
      setDisplayEndDate(false);
    }
    if (selectedDisplayedDateOption === "event") {
      setDisplayAdvisoryDate(false);
      setDisplayUpdatedDate(false);
      setDisplayStartDate(true);
      setDisplayEndDate(true);
    }
    if (selectedDisplayedDateOption === "no") {
      setDisplayAdvisoryDate(false);
      setDisplayUpdatedDate(false);
      setDisplayStartDate(false);
      setDisplayEndDate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- The displayed-date flags are derived exclusively from the selected option.
  }, [selectedDisplayedDateOption]);

  /**
   * Saves the advisory as a draft in the CMS (with "Draft" status).
   * The backend middleware determines whether this is an in-place update
   * or a new revision when the current advisory is published.
   * @returns {void}
   */
  async function handleSaveDraft() {
    // Don't submit if validation fails
    if (!validAdvisoryData(advisoryData, linksRef, mode, linkErrorsStatus))
      return;

    // Don't submit again if a request is in progress
    if (isSavingDraft) return;

    // Get the Strapi data for the "Draft" advisory status from its code
    const draftStatus = advisoryStatuses.find(
      (status) => status.code === "DFT",
    );

    if (mode === "update") {
      // Update advisory with "Draft" status
      await updateAdvisory(draftStatus);
    } else {
      // Create advisory with "Draft" status
      await createAdvisory(draftStatus);
    }
  }

  /**
   * Creates or updates the advisory without submitting for review. For users who can publish directly.
   * @returns {void}
   */
  async function handlePublish() {
    // Don't submit if validation fails
    if (!validAdvisoryData(advisoryData, linksRef, mode, linkErrorsStatus))
      return;

    let publishedStatus;

    // Super admins can specify the publishing status with an extra `advisoryStatus` field on the form
    if (hasAnyRole([ROLES.SUPER_ADMIN]) && advisoryStatus) {
      // Get the Strapi data for the advisory status from the selected value
      publishedStatus = advisoryStatuses.find(
        (status) => status.value === advisoryStatus,
      );
    } else {
      // Get the Strapi data for the "Published" advisory status from its code
      publishedStatus = advisoryStatuses.find(
        (status) => status.code === "PUB",
      );
    }

    if (mode === "update") {
      // Update advisory
      await updateAdvisory(publishedStatus);
    } else {
      // Create advisory
      await createAdvisory(publishedStatus);
    }
  }

  async function handleSubmitForReview() {
    // Don't submit if validation fails
    if (!validAdvisoryData(advisoryData, linksRef, mode, linkErrorsStatus))
      return;

    // Get the Strapi data for the "Submitted for HQ review" advisory status from its code
    const submittedStatus = advisoryStatuses.find(
      (status) => status.code === "HQR",
    );

    if (mode === "update") {
      await updateAdvisory(submittedStatus);
    } else {
      await createAdvisory(submittedStatus);
    }
  }

  return (
    <form className="advisory-form">
      <section>
        <h3>Affected resource(s)</h3>
        <AdvisoryAreaPicker
          mode={mode}
          data={{
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
            advisoryData,
            affectedResourceError,
          }}
        />
      </section>

      <section className="shown-on-public-site">
        <h3>Public advisory / closure content</h3>
        <p>This information is displayed on the public website.</p>

        <Form.Group className="form-group" controlId="resource-status">
          <Form.Label>
            <span className="append-required">Resource status</span>
            <LightTooltip
              arrow
              title={t("advisoryForm.resourceStatus.tooltip")}
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>

          <Select
            id="resource-status"
            options={accessStatuses}
            value={accessStatuses.filter((e) => e.value === accessStatus)}
            onChange={(e) => setAccessStatus(e ? e.value : 0)}
            placeholder="Search or select resource status"
            className="bcgov-select"
          />
        </Form.Group>

        <Form.Group className="form-group" controlId="event-type">
          <Form.Label>
            <span className="append-required">Event type</span>
            <LightTooltip arrow title={t("advisoryForm.eventType.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>
          <div
            className={classNames({
              "bcgov-select-error": eventTypeError !== "",
            })}
          >
            <Select
              id="event-type"
              options={eventTypes}
              value={eventTypes.filter((e) => e.value === eventType)}
              onChange={(e) => setEventType(e ? e.value : 0)}
              placeholder="Search or select an event type"
              className="bcgov-select"
              onBlur={() => {
                validateRequiredSelect(advisoryData.eventType);
              }}
              isClearable
            />
            {renderHelperText(eventTypeError, eventTypeError !== "")}
          </div>
        </Form.Group>

        <Form.Group className="form-group">
          <Form.Label htmlFor={headlineInput.id}>
            <span className="append-required">Headline</span>
            <LightTooltip arrow title={t("advisoryForm.headline.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>
          <Form.Control
            value={headline}
            onChange={(event) => {
              setHeadline(event.target.value);
            }}
            className={getControlClassName(headlineError !== "")}
            maxLength={255}
            id={headlineInput.id}
            required={headlineInput.required}
            placeholder="e.g. Temporary closures due to trail cleanup"
            onBlur={() => {
              validateRequiredText(advisoryData.headline);
            }}
          />
          {renderHelperText(headlineError, headlineError !== "")}
        </Form.Group>

        <Form.Group className="form-group" controlId="urgency-level">
          <Form.Label>
            <span className="append-required">Urgency level</span>
            <LightTooltip arrow title={t("advisoryForm.urgencyLevel.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>
          <div>
            <ButtonGroup
              className="urgency-btn-group"
              aria-label="Urgency level"
            >
              {urgencies.map((u) => (
                <Btn
                  key={u.value}
                  onClick={() => {
                    setUrgency(u.value);
                  }}
                  className={
                    urgency === u.value ? `btn-urgency-${u.sequence}` : ""
                  }
                  variant="outline-secondary"
                >
                  {urgency === u.value && (
                    <FontAwesomeIcon icon={faCheck} className="me-1" />
                  )}
                  {u.label}
                </Btn>
              ))}
            </ButtonGroup>
            {urgencies.map(
              (u) =>
                urgency === u.value && (
                  <div key={u.value} className="urgency-helper-text mt-1">
                    {u.sequence === 1 && (
                      <small>Low urgency for discretion and warnings</small>
                    )}
                    {u.sequence === 2 && (
                      <small>
                        Medium urgency for safety and health related
                      </small>
                    )}
                    {u.sequence === 3 && (
                      <small>
                        High urgency for immediate danger and closures
                      </small>
                    )}
                  </div>
                ),
            )}
            {renderHelperText(urgencyError, urgencyError !== "")}
          </div>
        </Form.Group>

        <h4>Description</h4>

        <Form.Group className="form-group" controlId="standard-messages">
          <Form.Label>
            Standard message(s)
            <LightTooltip
              arrow
              title={t("advisoryForm.standardMessages.tooltip")}
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>

          <Select
            id="standard-messages"
            options={standardMessages}
            value={selectedStandardMessages}
            onChange={(e) => {
              setSelectedStandardMessages(e);
            }}
            placeholder="Search or select standard message(s)"
            className="bcgov-select"
            isMulti
            isClearable
          />
        </Form.Group>

        <Form.Group className="form-group" controlId="custom-message">
          <Form.Label>
            Custom message
            <LightTooltip arrow title={t("advisoryForm.customMessage.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
            <br />
            <span className="field-description">
              Appears before any selected standard message(s)
            </span>
          </Form.Label>

          <CKEditor
            id="custom-message"
            value={description}
            onChange={setDescription}
          />
        </Form.Group>

        {/* Render a preview of selected standard messages */}
        {selectedStandardMessages.length > 0 && (
          <Form.Group
            className="form-group"
            controlId="standard-message-preview"
          >
            <Form.Label>Standard message preview</Form.Label>
            <div className="bcgov-textarea standard-message-preview">
              {selectedStandardMessages.map((message, i) => (
                <div
                  key={i}
                  className="standard-message"
                  dangerouslySetInnerHTML={{
                    __html: message.obj.description || "",
                  }}
                />
              ))}
            </div>
          </Form.Group>
        )}

        <Form.Group className="form-group">
          <Form.Label>
            Attach item(s) below the advisory/closure message
            <LightTooltip arrow title={t("advisoryForm.attachFiles.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>
        </Form.Group>

        {linksRef.current.map((l, idx) => (
          <div key={idx} className="sub-section">
            <Form.Group className="form-group" controlId={`link-type-${idx}`}>
              <Form.Label>
                <span className="append-required">Type</span>
              </Form.Label>

              <div className="d-flex">
                <div
                  className={classNames(
                    "bcgov-select-form flex-grow-1 flex-shrink-1",
                    {
                      "bcgov-select-error": linkTypeErrors[idx],
                    },
                  )}
                >
                  <Select
                    id={`link-type-${idx}`}
                    options={linkTypes}
                    onChange={(e) => {
                      updateLink(idx, "type", e.value);
                    }}
                    value={linkTypes.filter((o) => o.value === l.type)}
                    className="bcgov-select"
                    placeholder="Search or select link or document type"
                    onBlur={() =>
                      validateLink(l, idx, "type", setLinkTypeErrors)
                    }
                    styles={{
                      menu: (base) => ({ ...base, zIndex: 999 }),
                    }}
                  />
                  {renderHelperText(
                    linkTypeErrors[idx] && "Provide a link type",
                    linkTypeErrors[idx],
                  )}
                </div>

                <button
                  className="pointer btn flex-shrink-0 flex-grow-0 ms-2"
                  tabIndex="0"
                  style={{
                    width: "36px",
                    minWidth: "36px",
                    maxWidth: "36px",
                    height: "36px",
                    display: "flex",
                    alignSelf: "flex-start",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onClick={() => {
                    removeLink(idx);
                  }}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </Form.Group>

            <Form.Group className="form-group" controlId={`link-title-${idx}`}>
              <Form.Label>
                <span className="append-required">Title</span>
              </Form.Label>

              <Form.Control
                value={l.title}
                onChange={(event) => {
                  updateLink(idx, "title", event.target.value);
                }}
                className={getControlClassName(linkTitleErrors[idx])}
                maxLength={255}
                required={linkTitleInput.required}
                onBlur={() => validateLink(l, idx, "title", setLinkTitleErrors)}
              />
              {renderHelperText(
                linkTitleErrors[idx] && "Provide a link title",
                linkTitleErrors[idx],
              )}
            </Form.Group>

            {l.format !== "file" && !hasFileDeleted[idx] ? (
              <Form.Group className="form-group">
                <Form.Label htmlFor={`${linkUrlInput.id}-${idx}`}>
                  <span className="append-required">URL</span>
                </Form.Label>

                <InputGroup>
                  <Form.Control
                    value={l.file ? l.file.url : l.url}
                    onChange={(event) => {
                      updateLink(idx, "url", event.target.value);
                    }}
                    className={getControlClassName(linkUrlErrors[idx], "url")}
                    onBlur={() => validateLink(l, idx, "url", setLinkUrlErrors)}
                    maxLength={255}
                    id={`${linkUrlInput.id}-${idx}`}
                    required={linkUrlInput.required}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isFile(l.url)) {
                        setHasFileDeleted((prev) => {
                          hasFileDeleted[idx] = true;
                          return [...prev];
                        });
                      }
                      updateLink(idx, "url", "");
                    }}
                    className="clear-url-btn"
                    aria-label="Clear URL"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </InputGroup>
                {renderHelperText(
                  linkUrlErrors[idx] && "Provide a URL",
                  linkUrlErrors[idx],
                )}
              </Form.Group>
            ) : (
              <Form.Group className="form-group">
                <Form.Label htmlFor={`file-upload-${idx}`}>
                  <span className="append-required">File</span>
                </Form.Label>

                {l.file ? (
                  <InputGroup>
                    <Form.Control
                      value={l.file ? l.file.name : ""}
                      className={getControlClassName(false)}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLink(idx, "file", "");
                        validateLink(l, idx, "file", setLinkFileErrors);
                      }}
                      className="clear-url-btn"
                      aria-label="Clear file"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </InputGroup>
                ) : (
                  <>
                    <input
                      id={`file-upload-${idx}`}
                      hidden
                      type="file"
                      accept=".jpg,.gif,.png,.gif,.pdf"
                      onChange={(e) => {
                        handleFileCapture(e.target.files, idx);
                      }}
                    />
                    <Btn
                      variant="outline-secondary"
                      as="span"
                      className="act-add-link add-file ms-2"
                    >
                      Browse
                    </Btn>
                    {linkFileErrors[idx] && (
                      <span className="d-block text-danger act-helper-text">
                        Select a file
                      </span>
                    )}
                  </>
                )}
              </Form.Group>
            )}
          </div>
        ))}

        <Form.Group className="form-group">
          <div className="d-flex align-items-center justify-content-center">
            <input
              id="file-upload"
              hidden
              type="file"
              accept=".jpg,.gif,.png,.gif,.pdf"
              onChange={(e) => {
                handleFileCapture(
                  e.target.files,
                  linksRef.current.length > 0 ? linksRef.current.length - 1 : 0,
                );
              }}
            />
            <label htmlFor="file-upload" className="mb-0">
              <Btn
                variant="outline-secondary"
                as="span"
                className="act-add-link add-file"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addLink("file");
                  }
                }}
                onClick={() => {
                  addLink("file");
                }}
              >
                + Upload file
              </Btn>
            </label>
            <span className="mx-2">OR</span>
            <Btn
              variant="outline-secondary"
              className="act-add-link add-url"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addLink("url");
                }
              }}
              onClick={() => {
                addLink("url");
              }}
            >
              Add URL
            </Btn>
          </div>
        </Form.Group>
      </section>

      <section>
        <h3>Advisory / closure dates</h3>

        <div className="sub-section">
          <h4>Post date(s)</h4>

          <div className="row mb-3 date-time-row">
            <div className="col-12 col-sm-6 col-md-5">
              <Form.Group className="form-group">
                <Form.Label htmlFor="post-start-date">
                  <span className="append-required">Posting date</span>
                  <LightTooltip
                    arrow
                    title={t("advisoryForm.postingDate.tooltip")}
                  >
                    <FontAwesomeIcon
                      icon={faCircleQuestion}
                      className="helpIcon"
                    />
                  </LightTooltip>
                </Form.Label>

                <div className="input-with-append">
                  <DatePicker
                    id="post-start-date"
                    selected={advisoryDate}
                    onChange={(date) => {
                      handleAdvisoryDateChange(date);
                    }}
                    fixedHeight
                    dateFormat="MMMM d, yyyy"
                    maxDate={expiryDate}
                    className={`${advisoryDateError !== "" ? "error" : ""}`}
                    onBlur={() => {
                      validateRequiredDate(advisoryData.advisoryDate);
                      validateDisplayedDate(advisoryData.displayedDate);
                    }}
                  />

                  <FontAwesomeIcon
                    className="append-content"
                    icon={faCalendarCheck}
                  />
                </div>

                {renderHelperText("month dd, yyyy")}

                {advisoryDateError !== "" &&
                  renderHelperText("Enter a valid date", true)}
              </Form.Group>
            </div>

            <div className="col-12 col-sm-6 col-md-5">
              <Form.Group className="form-group">
                <Form.Label htmlFor="post-start-time">Time</Form.Label>

                <div className="d-flex align-items-center gap-2">
                  <div className="input-with-append flex-grow-1">
                    <DatePicker
                      id="post-start-time"
                      selected={advisoryDate}
                      onChange={(date) => handleAdvisoryDateChange(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={`${advisoryDateError !== "" ? "error" : ""}`}
                    />

                    <FontAwesomeIcon
                      className="append-content"
                      icon={faClock}
                    />
                  </div>

                  <span className="time-zone">PT</span>
                </div>

                {renderHelperText("hh:mm aa")}
              </Form.Group>
            </div>
          </div>

          <div className="row date-time-row">
            <div className="col-12 col-sm-6 col-md-5">
              <Form.Group className="form-group">
                <Form.Label htmlFor="post-expiry-date">
                  Expiry date
                  <LightTooltip
                    arrow
                    title={t("advisoryForm.expiryDate.tooltip")}
                  >
                    <FontAwesomeIcon
                      icon={faCircleQuestion}
                      className="helpIcon"
                    />
                  </LightTooltip>
                </Form.Label>

                <div className="input-with-append">
                  <DatePicker
                    id="post-expiry-date"
                    selected={expiryDate}
                    onChange={(date) => {
                      setExpiryDate(date);
                    }}
                    fixedHeight
                    dateFormat="MMMM d, yyyy"
                    minDate={advisoryDate}
                    className={`${expiryDateError !== "" ? "error" : ""}`}
                    onBlur={() => {
                      validateOptionalDate(advisoryData.expiryDate);
                    }}
                  />

                  <FontAwesomeIcon
                    className="append-content"
                    icon={faCalendarCheck}
                  />
                </div>

                {renderHelperText("month dd, yyyy")}
                {expiryDateError !== "" &&
                  renderHelperText(
                    "Expiry date should not be before Posting date",
                    true,
                  )}
              </Form.Group>
            </div>

            <div className="col-12 col-sm-6 col-md-5">
              <Form.Group className="form-group">
                <Form.Label htmlFor="post-expiry-time">Time</Form.Label>

                <div className="d-flex align-items-center gap-2">
                  <div className="input-with-append flex-grow-1">
                    <DatePicker
                      id="post-expiry-time"
                      selected={expiryDate}
                      onChange={(date) => {
                        setExpiryDate(date);
                      }}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className={`${expiryDateError !== "" ? "error" : ""}`}
                    />

                    <FontAwesomeIcon
                      className="append-content"
                      icon={faClock}
                    />
                  </div>

                  <span className="time-zone">PT</span>
                </div>

                {renderHelperText("hh:mm aa")}
              </Form.Group>
            </div>
          </div>

          {mode === "update" && (
            <div className="row mb-3 date-time-row">
              <div className="col-12 col-sm-6 col-md-5">
                <Form.Group className="form-group">
                  <Form.Label htmlFor="updated-date">Updated date</Form.Label>

                  <div className="input-with-append">
                    <DatePicker
                      id="updated-date"
                      selected={updatedDate}
                      onChange={(date) => {
                        setUpdatedDate(date);
                      }}
                      fixedHeight
                      dateFormat="MMMM d, yyyy"
                      minDate={advisoryDate}
                      className={`${updatedDateError !== "" ? "error" : ""}`}
                      onBlur={() => {
                        validateOptionalDate(advisoryData.updatedDate);
                        validateDisplayedDate(advisoryData.displayedDate);
                      }}
                    />

                    <FontAwesomeIcon
                      className="append-content"
                      icon={faCalendarCheck}
                    />
                  </div>

                  {renderHelperText("month dd, yyyy")}
                </Form.Group>
              </div>

              <div className="col-12 col-sm-6 col-md-5">
                <Form.Group className="form-group">
                  <Form.Label htmlFor="updated-time">Time</Form.Label>

                  <div className="d-flex align-items-center gap-2">
                    <div className="input-with-append flex-grow-1">
                      <DatePicker
                        id="updated-time"
                        selected={updatedDate}
                        onChange={(date) => {
                          setUpdatedDate(date);
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        className={`${updatedDateError !== "" ? "error" : ""}`}
                      />

                      <FontAwesomeIcon
                        className="append-content"
                        icon={faClock}
                      />
                    </div>

                    <span className="time-zone">PT</span>
                  </div>

                  {renderHelperText("hh:mm aa")}
                </Form.Group>
              </div>
            </div>
          )}
        </div>

        {!showEventDates && (
          <p>
            <button
              type="button"
              className="btn mt-2 btn-link btn-boolean with-icon"
              onClick={() => setShowEventDates(true)}
            >
              Add event dates
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </p>
        )}

        {showEventDates && (
          <>
            <div className="sub-section">
              <h4>Event date(s)</h4>

              <div className="row mb-3 date-time-row">
                <div className="col-12 col-sm-6 col-md-5">
                  <Form.Group
                    className="form-group"
                    controlId="event-start-date"
                  >
                    <Form.Label>
                      Start date
                      <LightTooltip
                        arrow
                        title={t("advisoryForm.startDate.tooltip")}
                      >
                        <FontAwesomeIcon
                          icon={faCircleQuestion}
                          className="helpIcon"
                        />
                      </LightTooltip>
                    </Form.Label>
                    <div className="input-with-append">
                      <DatePicker
                        id="start-date"
                        selected={startDate}
                        onChange={(date) => {
                          setStartDate(date);
                        }}
                        fixedHeight
                        dateFormat="MMMM d, yyyy"
                        maxDate={endDate}
                        className={`${startDateError !== "" ? "error" : ""}`}
                        onBlur={() => {
                          validateOptionalDate(advisoryData.startDate);
                          validateDisplayedDate(advisoryData.displayedDate);
                        }}
                      />

                      <FontAwesomeIcon
                        className="append-content"
                        icon={faCalendarCheck}
                      />
                    </div>

                    {renderHelperText("month dd, yyyy")}
                  </Form.Group>
                </div>

                <div className="col-12 col-sm-6 col-md-5">
                  <Form.Group className="form-group">
                    <Form.Label htmlFor="event-start-time">Time</Form.Label>

                    <div className="d-flex align-items-center gap-2">
                      <div className="input-with-append flex-grow-1">
                        <DatePicker
                          id="event-start-time"
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className={`${startDateError !== "" ? "error" : ""}`}
                        />

                        <FontAwesomeIcon
                          className="append-content"
                          icon={faClock}
                        />
                      </div>

                      <span className="time-zone">PT</span>
                    </div>

                    {renderHelperText("hh:mm aa")}
                  </Form.Group>
                </div>
              </div>

              <div className="row date-time-row">
                <div className="col-12 col-sm-6 col-md-5">
                  <Form.Group className="form-group" controlId="event-end-date">
                    <Form.Label>
                      End date
                      <LightTooltip
                        arrow
                        title={t("advisoryForm.endDate.tooltip")}
                      >
                        <FontAwesomeIcon
                          icon={faCircleQuestion}
                          className="helpIcon"
                        />
                      </LightTooltip>
                    </Form.Label>

                    <div className="input-with-append">
                      <DatePicker
                        id="event-end-date"
                        selected={endDate}
                        onChange={(date) => {
                          setEndDate(date);
                        }}
                        fixedHeight
                        dateFormat="MMMM d, yyyy"
                        minDate={startDate}
                        className={`${endDateError !== "" ? "error" : ""}`}
                        onBlur={() => {
                          validateOptionalDate(advisoryData.endDate);
                          validateDisplayedDate(advisoryData.displayedDate);
                        }}
                      />

                      <FontAwesomeIcon
                        className="append-content"
                        icon={faCalendarCheck}
                      />
                    </div>

                    {renderHelperText("month dd, yyyy")}

                    {endDateError !== "" &&
                      renderHelperText(
                        "End date should not be before Posting date",
                        true,
                      )}
                  </Form.Group>
                </div>

                <div className="col-12 col-sm-6 col-md-5">
                  <Form.Group className="form-group">
                    <Form.Label htmlFor="event-end-time">Time</Form.Label>

                    <div className="d-flex align-items-center gap-2">
                      <div className="input-with-append flex-grow-1">
                        <DatePicker
                          id="event-end-time"
                          selected={endDate}
                          onChange={(date) => setEndDate(date)}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className={`${endDateError !== "" ? "error" : ""}`}
                        />

                        <FontAwesomeIcon
                          className="append-content"
                          icon={faClock}
                        />
                      </div>

                      <span className="time-zone">PT</span>
                    </div>

                    {renderHelperText("hh:mm aa")}
                  </Form.Group>
                </div>
              </div>
            </div>

            <p>
              <button
                type="button"
                className="btn mt-2 btn-link btn-boolean with-icon"
                onClick={() => setShowEventDates(false)}
              >
                Hide event dates
                <FontAwesomeIcon icon={faChevronUp} />
              </button>
            </p>
          </>
        )}

        <Form.Group className="form-group">
          <Form.Label htmlFor="displayed-date">
            Displayed date
            <LightTooltip arrow title={t("advisoryForm.displayedDate.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>

          <div
            className={classNames("bcgov-select-form", {
              "bcgov-select-error": displayedDateError !== "",
            })}
          >
            <Select
              id="displayed-date"
              options={displayedDateOptions}
              defaultValue={getDisplayedDate()}
              onChange={(e) => {
                setSelectedDisplayedDateOption(e.value);
              }}
              className="bcgov-select"
              onBlur={() => {
                validateDisplayedDate(advisoryData.displayedDate);
              }}
            />
            {renderHelperText(displayedDateError, displayedDateError !== "")}
          </div>
        </Form.Group>
      </section>

      <section>
        <h3>Internal details</h3>

        <Form.Group className="form-group" controlId={notesInput.id}>
          <Form.Label>
            Internal notes
            <LightTooltip arrow title={t("advisoryForm.internalNotes.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>

          <Form.Control
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            className={getControlClassName(false)}
            required={notesInput.required}
          />
        </Form.Group>

        {hasAnyRole([ROLES.ADVISORY_PUBLISH_WITHOUT_APPROVAL]) && (
          <Form.Group className="form-group" controlId={submitterInput.id}>
            <Form.Label>
              Requested by
              <LightTooltip arrow title={t("advisoryForm.requestedBy.tooltip")}>
                <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
              </LightTooltip>
            </Form.Label>

            <Form.Control
              value={submittedBy}
              onChange={(event) => {
                setSubmittedBy(event.target.value);
              }}
              className={getControlClassName(false)}
              maxLength={255}
              required={submitterInput.required}
            />
          </Form.Group>
        )}

        <Form.Group className="form-group" controlId={listingRankInput.id}>
          <Form.Label>
            Listing rank
            <LightTooltip arrow title={t("advisoryForm.listingRank.tooltip")}>
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>

          <div style={{ width: "8em" }}>
            <Form.Control
              type="number"
              value={listingRank}
              onChange={(event) => {
                const value = event.target.value;
                const parsed = parseInt(value, 10);

                setListingRank(isNaN(parsed) ? 0 : parsed);
              }}
              onWheel={(event) => {
                event.target.blur();
              }}
              className={getControlClassName(listingRankError !== "")}
              required={listingRankInput.required}
              min={0}
              max={9999}
              onBlur={() => {
                validateOptionalNumber(advisoryData.listingRank);
              }}
            />
            {renderHelperText(listingRankError, listingRankError !== "")}
          </div>
        </Form.Group>

        <Form.Group className="form-group" controlId="public-safety-related">
          <Form.Label>
            Public safety related
            <LightTooltip
              arrow
              title={t("advisoryForm.publicSafetyRelated.tooltip")}
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </Form.Label>

          <div>
            <ButtonGroup
              className="safety-btn-group"
              aria-label="Public safety related"
            >
              <Btn
                onClick={() => setIsSafetyRelated(true)}
                className={
                  isSafetyRelated === true ? "btn-safety-selected" : ""
                }
                variant="outline-secondary"
              >
                {isSafetyRelated === true && (
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                )}
                Yes
              </Btn>
              <Btn
                onClick={() => setIsSafetyRelated(false)}
                className={
                  isSafetyRelated === false ? "btn-safety-selected" : ""
                }
                variant="outline-secondary"
              >
                {isSafetyRelated === false && (
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                )}
                No
              </Btn>
            </ButtonGroup>
          </div>
        </Form.Group>

        {hasAnyRole([ROLES.SUPER_ADMIN]) && (
          <Form.Group className="form-group">
            <Form.Label htmlFor="advisory-status">
              <span className="append-required">Advisory status</span>
            </Form.Label>

            <div
              className={classNames("bcgov-select-form", {
                "bcgov-select-error": advisoryStatusError !== "",
              })}
            >
              <Select
                id="advisory-status"
                options={advisoryStatuses}
                value={advisoryStatuses.filter(
                  (a) => a.value === advisoryStatus,
                )}
                onChange={(e) => setAdvisoryStatus(e ? e.value : null)}
                placeholder="Search or select an advisory status"
                className="bcgov-select"
                isClearable
              />
              {renderHelperText(
                advisoryStatusError,
                advisoryStatusError !== "",
              )}
            </div>
          </Form.Group>
        )}
      </section>

      {!hasAnyRole([ROLES.ADVISORY_PUBLISH_WITHOUT_APPROVAL]) &&
        (isStatHoliday || isAfterHours) && (
          <section className="act-af-hour-box d-flex field-bg-blue">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="warningIcon"
            />
            <div className="ms-3">
              <p>
                <b>This is an after-hours advisory</b>
                <br />
                The web team&rsquo;s business hours are
                <br />
                Monday to Friday, 8:30 am – 4:30 pm.
              </p>

              <div className="d-flex flex-column gap-2 mt-3">
                <Form.Check>
                  <Form.Check.Input
                    id="urgent-publish-immediately"
                    type="radio"
                    checked={isAfterHourPublish}
                    onChange={() => {
                      setIsAfterHourPublish(true);
                    }}
                    value="Publish"
                    name="after-hour-submission"
                    aria-label="Publish immediately"
                  />

                  <Form.Check.Label htmlFor="urgent-publish-immediately">
                    <b className="required">Urgent/safety-related advisory.</b>{" "}
                    Publish immediately.
                  </Form.Check.Label>
                </Form.Check>

                <Form.Check>
                  <Form.Check.Input
                    id="urgent-publish-review"
                    type="radio"
                    checked={!isAfterHourPublish}
                    onChange={() => {
                      setIsAfterHourPublish(false);
                    }}
                    value="Review"
                    name="after-hour-submission"
                    aria-label="Submit for web team review"
                  />

                  <Form.Check.Label htmlFor="urgent-publish-review">
                    <b>Advisory is not urgent.</b> Submit for web team review.
                  </Form.Check.Label>
                </Form.Check>
              </div>
            </div>
          </section>
        )}

      <section className="action-buttons">
        {renderHelperText(formError, formError !== "", "mb-3")}

        <div className="d-flex justify-content-start gap-2">
          <DraftButton onClick={handleSaveDraft} hasLoader={isSavingDraft} />

          <PrimaryActions
            mode={mode}
            advisoryStatusCode={advisoryStatusCode}
            isUrgent={isAfterHourPublish}
            isApprover={isApprover}
            onPublish={handlePublish}
            onSubmit={handleSubmitForReview}
            isSubmitting={isSubmitting}
          />
        </div>
      </section>
    </form>
  );
}

AdvisoryForm.propTypes = {
  mode: PropTypes.string.isRequired,
  data: PropTypes.shape({
    listingRank: PropTypes.number,
    setListingRank: PropTypes.func.isRequired,
    headline: PropTypes.string,
    setHeadline: PropTypes.func.isRequired,
    eventType: PropTypes.string,
    eventTypes: PropTypes.array.isRequired,
    setEventType: PropTypes.func.isRequired,
    accessStatus: PropTypes.string,
    accessStatuses: PropTypes.array.isRequired,
    setAccessStatus: PropTypes.func.isRequired,
    description: PropTypes.string,
    setDescription: PropTypes.func.isRequired,
    standardMessages: PropTypes.array.isRequired,
    selectedStandardMessages: PropTypes.array,
    setSelectedStandardMessages: PropTypes.func.isRequired,
    recreationResources: PropTypes.array.isRequired,
    selectedRecreationResources: PropTypes.array,
    setSelectedRecreationResources: PropTypes.func.isRequired,
    protectedAreas: PropTypes.array.isRequired,
    selectedProtectedAreas: PropTypes.array,
    setSelectedProtectedAreas: PropTypes.func.isRequired,
    regions: PropTypes.array.isRequired,
    selectedRegions: PropTypes.array,
    setSelectedRegions: PropTypes.func.isRequired,
    sections: PropTypes.array.isRequired,
    selectedSections: PropTypes.array,
    setSelectedSections: PropTypes.func.isRequired,
    managementAreas: PropTypes.array.isRequired,
    selectedManagementAreas: PropTypes.array,
    setSelectedManagementAreas: PropTypes.func.isRequired,
    sites: PropTypes.array.isRequired,
    selectedSites: PropTypes.array,
    setSelectedSites: PropTypes.func.isRequired,
    fireCentres: PropTypes.array.isRequired,
    selectedFireCentres: PropTypes.array,
    setSelectedFireCentres: PropTypes.func.isRequired,
    fireZones: PropTypes.array.isRequired,
    selectedFireZones: PropTypes.array,
    setSelectedFireZones: PropTypes.func.isRequired,
    naturalResourceDistricts: PropTypes.array.isRequired,
    selectedNaturalResourceDistricts: PropTypes.array,
    setSelectedNaturalResourceDistricts: PropTypes.func.isRequired,
    urgencies: PropTypes.array.isRequired,
    urgency: PropTypes.string,
    setUrgency: PropTypes.func.isRequired,
    isSafetyRelated: PropTypes.bool,
    setIsSafetyRelated: PropTypes.func.isRequired,
    advisoryDate: PropTypes.object,
    handleAdvisoryDateChange: PropTypes.func.isRequired,
    displayAdvisoryDate: PropTypes.bool,
    setDisplayAdvisoryDate: PropTypes.func.isRequired,
    startDate: PropTypes.object,
    setStartDate: PropTypes.func.isRequired,
    displayStartDate: PropTypes.bool,
    setDisplayStartDate: PropTypes.func.isRequired,
    endDate: PropTypes.object,
    setEndDate: PropTypes.func.isRequired,
    displayEndDate: PropTypes.bool,
    setDisplayEndDate: PropTypes.func.isRequired,
    updatedDate: PropTypes.object,
    setUpdatedDate: PropTypes.func.isRequired,
    displayUpdatedDate: PropTypes.bool,
    setDisplayUpdatedDate: PropTypes.func.isRequired,
    expiryDate: PropTypes.object,
    setExpiryDate: PropTypes.func.isRequired,
    linksRef: PropTypes.object.isRequired,
    linkTypes: PropTypes.array.isRequired,
    removeLink: PropTypes.func.isRequired,
    updateLink: PropTypes.func.isRequired,
    addLink: PropTypes.func.isRequired,
    handleFileCapture: PropTypes.func.isRequired,
    isApprover: PropTypes.bool,
    notes: PropTypes.string,
    setNotes: PropTypes.func.isRequired,
    submittedBy: PropTypes.string,
    setSubmittedBy: PropTypes.func.isRequired,
    advisoryStatuses: PropTypes.array.isRequired,
    advisoryStatusCode: PropTypes.string,
    advisoryStatus: PropTypes.string,
    setAdvisoryStatus: PropTypes.func.isRequired,
    isStatHoliday: PropTypes.bool,
    isAfterHours: PropTypes.bool,
    isAfterHourPublish: PropTypes.bool,
    setIsAfterHourPublish: PropTypes.func.isRequired,
    createAdvisory: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    isSavingDraft: PropTypes.bool,
    updateAdvisory: PropTypes.func.isRequired,
    formError: PropTypes.string,
    setFormError: PropTypes.func.isRequired,
  }).isRequired,
};
