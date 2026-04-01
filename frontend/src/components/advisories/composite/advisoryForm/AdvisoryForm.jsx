import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./AdvisoryForm.css";
import { Button } from "@/components/advisories/shared/button/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Btn from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faXmark } from "@fa-kit/icons/classic/regular";
import { faCheck, faCircleQuestion } from "@fa-kit/icons/classic/solid";
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
import LightTooltip from "@/components/advisories/shared/tooltip/LightTooltip";
import AdvisoryAreaPicker from "@/components/advisories/composite/advisoryAreaPicker/AdvisoryAreaPicker";
import CKEditor from "@/components/advisories/composite/ckeditor/CKEditor";

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
    notes,
    setNotes,
    submittedBy,
    setSubmittedBy,
    advisoryStatuses,
    advisoryStatus,
    setAdvisoryStatus,
    isStatHoliday,
    isAfterHours,
    isAfterHourPublish,
    setIsAfterHourPublish,
    saveAdvisory,
    isSubmitting,
    isSavingDraft,
    updateAdvisory,
    formError,
    setFormError,
  },
}) {
  const { hasAnyRole } = useAccess();

  const [protectedAreaError, setProtectedAreaError] = useState("");
  const [eventTypeError, setEventTypeError] = useState("");
  const [urgencyError, setUrgencyError] = useState("");
  const [advisoryStatusError, setAdvisoryStatusError] = useState("");
  const [headlineError, setHeadlineError] = useState("");
  const [advisoryDateError, setAdvisoryDateError] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [expiryDateError, setExpiryDateError] = useState("");
  const [updatedDateError, setUpdatedDateError] = useState("");
  const [submittedByError, setSubmittedByError] = useState("");
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
    protectedArea: {
      value: [
        selectedProtectedAreas,
        selectedRegions,
        selectedSections,
        selectedManagementAreas,
        selectedFireCentres,
        selectedFireZones,
        selectedNaturalResourceDistricts,
        selectedSites,
      ],
      setError: setProtectedAreaError,
      text: "at least one park",
    },
    urgency: { value: urgency, setError: setUrgencyError, text: "urgency" },
    advisoryDate: { value: advisoryDate, setError: setAdvisoryDateError },
    startDate: { value: startDate, setError: setStartDateError },
    endDate: { value: endDate, setError: setEndDateError },
    expiryDate: { value: expiryDate, setError: setExpiryDateError },
    updatedDate: { value: updatedDate, setError: setUpdatedDateError },
    submittedBy: {
      value: submittedBy,
      setError: setSubmittedByError,
      text: "requested by",
    },
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
        className={`ad-helper-text ${isError ? "text-danger" : ""} ${className}`.trim()}
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

  return (
    <form className="mt-5">
      <div className="container-fluid ad-form">
        <div className="row heading">Affected area</div>
        <AdvisoryAreaPicker
          data={{
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
            protectedAreaError,
          }}
        />
        <div className="row heading">Advisory content</div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label bcgov-required">
            Headline
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <Form.Control
              value={headline}
              onChange={(event) => {
                setHeadline(event.target.value);
              }}
              className={getControlClassName(headlineError !== "")}
              maxLength={255}
              id={headlineInput.id}
              required={headlineInput.required}
              onBlur={() => {
                validateRequiredText(advisoryData.headline);
              }}
            />
            {renderHelperText(headlineError, headlineError !== "")}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label bcgov-required">
            Event type
            <LightTooltip
              arrow
              title="Please select the most appropriate event type that your advisory falls under, this does impact the front-end.
                For example, freshet and wildfire event types load conditional content to their respective flood and wildfire pages."
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <div
              className={`bcgov-select-form ${
                eventTypeError !== "" ? "bcgov-select-error" : ""
              }`}
            >
              <Select
                options={eventTypes}
                value={eventTypes.filter((e) => e.value === eventType)}
                onChange={(e) => setEventType(e ? e.value : 0)}
                placeholder="Select an event type"
                className="bcgov-select"
                onBlur={() => {
                  validateRequiredSelect(advisoryData.eventType);
                }}
                isClearable
              />
              {renderHelperText(eventTypeError, eventTypeError !== "")}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label bcgov-required">
            Urgency level
            <LightTooltip
              arrow
              title="Dependant on your advisory, the urgency level can be used to prioritize your alert above existing alerts for the same park page.
                Ie, assigning a high urgency re wildfire closure will place that advisory at the top."
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
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
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Listing rank
            <LightTooltip
              arrow
              title="To display an advisory at the top of the list, add a Listing rank number.
              The advisory with the highest number will be displayed at the top.
              If the Listing rank number is zero,
              advisories are ordered by urgency level and date added."
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
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
              id={listingRankInput.id}
              required={listingRankInput.required}
              min={0}
              max={9999}
              onBlur={() => {
                validateOptionalNumber(advisoryData.listingRank);
              }}
            />
            {renderHelperText(listingRankError, listingRankError !== "")}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label bcgov-required">
            Park access status
            <LightTooltip
              arrow
              title="This status describes how the advisory event affects access to the park.
              The default is 'Open'. This selection triggers information to be displayed in various areas,
              such as on the BC Parks Map, closure/warning status icons in the various park lists,
              and closure status on park pages."
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <Select
              options={accessStatuses}
              value={accessStatuses.filter((e) => e.value === accessStatus)}
              onChange={(e) => setAccessStatus(e ? e.value : 0)}
              placeholder="Select park access status"
              className="bcgov-select"
            />
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Standard message(s)
            <LightTooltip
              arrow
              title="Standard messages are chosen from a list of generic, pre-defined and approved messages.
                This content will be added below any text entered in the description on the park page.
                There is no requirement to have both a description and standard messaging."
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="helpIcon" />
            </LightTooltip>
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <Select
              options={standardMessages}
              value={selectedStandardMessages}
              onChange={(e) => {
                setSelectedStandardMessages(e);
              }}
              placeholder="Add standard message(s)"
              className="bcgov-select"
              isMulti
              isClearable
            />
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Description
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <CKEditor value={description} onChange={setDescription} />
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Standard message preview
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <div className="bcgov-textarea">
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
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Add supporting information
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            {linksRef.current.map((l, idx) => (
              <div key={idx} className="field-bg-grey">
                <div className="row">
                  <div className="col-12 col-lg-3 col-md-2 ad-label bcgov-required">
                    Type
                  </div>
                  <div className="col-12 col-lg-9 col-md-10 d-flex">
                    <div
                      className={`bcgov-select-form ${
                        linkTypeErrors[idx] ? "bcgov-select-error" : ""
                      }`}
                    >
                      <Select
                        options={linkTypes}
                        onChange={(e) => {
                          updateLink(idx, "type", e.value);
                        }}
                        value={linkTypes.filter((o) => o.value === l.type)}
                        className="ad-link-select bcgov-select"
                        placeholder="Link or document type"
                        onBlur={() =>
                          validateLink(l, idx, "type", setLinkTypeErrors)
                        }
                        menuPosition="fixed"
                        menuPortalTarget={document.body}
                      />
                      {renderHelperText(
                        linkTypeErrors[idx] && "Please provide a link type",
                        linkTypeErrors[idx],
                      )}
                    </div>
                    <div
                      className="ad-link-close ad-add-link pointer div-btn"
                      tabIndex="0"
                      onClick={() => {
                        removeLink(idx);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          removeLink(idx);
                        }
                      }}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 col-lg-3 col-md-2 ad-label bcgov-required">
                    Title
                  </div>
                  <div className="col-12 col-lg-9 col-md-10">
                    <Form.Control
                      value={l.title}
                      onChange={(event) => {
                        updateLink(idx, "title", event.target.value);
                      }}
                      className={getControlClassName(linkTitleErrors[idx])}
                      maxLength={255}
                      id={linkTitleInput.id}
                      required={linkTitleInput.required}
                      onBlur={() =>
                        validateLink(l, idx, "title", setLinkTitleErrors)
                      }
                    />
                    {renderHelperText(
                      linkTitleErrors[idx] && "Please provide a link title",
                      linkTitleErrors[idx],
                    )}
                  </div>
                </div>
                {l.format !== "file" && !hasFileDeleted[idx] ? (
                  <div className="row">
                    <div className="col-12 col-lg-3 col-md-2 ad-label bcgov-required">
                      URL
                    </div>
                    <div className="col-12 col-lg-9 col-md-10">
                      <InputGroup>
                        <Form.Control
                          value={l.file ? l.file.url : l.url}
                          onChange={(event) => {
                            updateLink(idx, "url", event.target.value);
                          }}
                          className={getControlClassName(linkUrlErrors[idx])}
                          onBlur={() =>
                            validateLink(l, idx, "url", setLinkUrlErrors)
                          }
                          maxLength={255}
                          id={linkUrlInput.id}
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
                        linkUrlErrors[idx] && "Please provide a URL",
                        linkUrlErrors[idx],
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-12 col-lg-3 col-md-2 ad-label bcgov-required">
                      File
                    </div>
                    <div className="col-12 col-lg-9 col-md-8 ad-flex">
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
                            id="file-upload"
                            hidden
                            type="file"
                            accept=".jpg,.gif,.png,.gif,.pdf"
                            onChange={(e) => {
                              handleFileCapture(e.target.files, idx);
                            }}
                          />
                          <label htmlFor="file-upload" className="mb-0">
                            <Btn
                              variant="outline-secondary"
                              as="span"
                              className="ad-add-link add-file"
                            >
                              Browse
                            </Btn>
                            {linkFileErrors[idx] && (
                              <span className="d-block text-danger ad-helper-text">
                                Please upload file too
                              </span>
                            )}
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
                className="ad-add-link add-file"
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
            <span>OR</span>
            <Btn
              variant="outline-secondary"
              className="ad-add-link add-url"
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
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label pt-4">
            Event dates
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <div className="field-bg-grey">
              <div className="row">
                <div className="col-12 col-lg-3 col-md-4 ad-label">
                  Start date
                </div>
                <div className="col-12 col-lg-5 col-md-8">
                  <DatePicker
                    id="startDate"
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                    }}
                    dateFormat="MMMM d, yyyy"
                    maxDate={endDate}
                    className={`${startDateError !== "" ? "error" : ""}`}
                    onBlur={() => {
                      validateOptionalDate(advisoryData.startDate);
                      validateDisplayedDate(advisoryData.displayedDate);
                    }}
                  />
                  {renderHelperText("month dd, yyyy")}
                </div>
                <div className="col-12 col-lg-1 col-md-4 ad-label">Time</div>
                <div className="col-12 col-lg-3 col-md-8">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className={`${startDateError !== "" ? "error" : ""}`}
                  />
                  {renderHelperText("hh:mm aa")}
                </div>
              </div>
              <div className="row">
                <div className="col-12 col-lg-3 col-md-4 ad-label">
                  End date
                  <LightTooltip
                    arrow
                    title="Enter the event's end date.
                      If end date is unknown, enter a date when the advisory should be reviewed for relevance."
                  >
                    <FontAwesomeIcon
                      icon={faCircleQuestion}
                      className="helpIcon"
                    />
                  </LightTooltip>
                </div>
                <div className="col-12 col-lg-5 col-md-8">
                  <DatePicker
                    id="endDate"
                    selected={endDate}
                    onChange={(date) => {
                      setEndDate(date);
                    }}
                    dateFormat="MMMM d, yyyy"
                    minDate={startDate}
                    className={`${endDateError !== "" ? "error" : ""}`}
                    onBlur={() => {
                      validateOptionalDate(advisoryData.endDate);
                      validateDisplayedDate(advisoryData.displayedDate);
                    }}
                  />
                  {renderHelperText("month dd, yyyy")}
                  {endDateError !== "" &&
                    renderHelperText(
                      "End date should not be before Posting date",
                      true,
                    )}
                </div>
                <div className="col-12 col-lg-1 col-md-4 ad-label">Time</div>
                <div className="col-12 col-lg-3 col-md-8">
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className={`${endDateError !== "" ? "error" : ""}`}
                  />
                  {renderHelperText("hh:mm aa")}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Displayed date
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <div
              className={`bcgov-select-form ${
                displayedDateError !== "" ? "bcgov-select-error" : ""
              }`}
            >
              <Select
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
          </div>
        </div>
        <div className="row heading">Internal details</div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label pt-4">
            Post dates
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <div className="field-bg-grey">
              <div className="row">
                <div className="col-12 col-lg-3 col-md-4 ad-label bcgov-required">
                  Posting date
                </div>
                <div className="col-12 col-lg-5 col-md-8">
                  <DatePicker
                    id="advisoryDate"
                    selected={advisoryDate}
                    onChange={(date) => {
                      handleAdvisoryDateChange(date);
                    }}
                    dateFormat="MMMM d, yyyy"
                    maxDate={expiryDate}
                    className={`${advisoryDateError !== "" ? "error" : ""}`}
                    onBlur={() => {
                      validateRequiredDate(advisoryData.advisoryDate);
                      validateDisplayedDate(advisoryData.displayedDate);
                    }}
                  />
                  {renderHelperText("month dd, yyyy")}
                  {advisoryDateError !== "" &&
                    renderHelperText("Please enter valid date", true)}
                </div>
                <div className="col-12 col-lg-1 col-md-4 ad-label">Time</div>
                <div className="col-12 col-lg-3 col-md-8">
                  <DatePicker
                    selected={advisoryDate}
                    onChange={(date) => handleAdvisoryDateChange(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className={`${advisoryDateError !== "" ? "error" : ""}`}
                  />
                  {renderHelperText("hh:mm aa")}
                </div>
              </div>
              <div className="row">
                <div className="col-12 col-lg-3 col-md-4 ad-label">
                  Expiry date
                  <LightTooltip
                    arrow
                    title="The advisory will be automatically removed on this date."
                  >
                    <FontAwesomeIcon
                      icon={faCircleQuestion}
                      className="helpIcon"
                    />
                  </LightTooltip>
                </div>
                <div className="col-12 col-lg-5 col-md-8">
                  <DatePicker
                    id="expiryDate"
                    selected={expiryDate}
                    onChange={(date) => {
                      setExpiryDate(date);
                    }}
                    dateFormat="MMMM d, yyyy"
                    minDate={advisoryDate}
                    className={`${expiryDateError !== "" ? "error" : ""}`}
                    onBlur={() => {
                      validateOptionalDate(advisoryData.expiryDate);
                    }}
                  />
                  {renderHelperText("month dd, yyyy")}
                  {expiryDateError !== "" &&
                    renderHelperText(
                      "Expiry date should not be before Posting date",
                      true,
                    )}
                </div>
                <div className="col-12 col-lg-1 col-md-4 ad-label">Time</div>
                <div className="col-12 col-lg-3 col-md-8">
                  <DatePicker
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
                  {renderHelperText("hh:mm aa")}
                </div>
              </div>
              {mode === "update" && (
                <div className="row">
                  <div className="col-12 col-lg-3 col-md-4 ad-label">
                    Updated date
                  </div>
                  <div className="col-12 col-lg-5 col-md-8">
                    <DatePicker
                      id="updatedDate"
                      selected={updatedDate}
                      onChange={(date) => {
                        setUpdatedDate(date);
                      }}
                      dateFormat="MMMM d, yyyy"
                      minDate={advisoryDate}
                      className={`${updatedDateError !== "" ? "error" : ""}`}
                      onBlur={() => {
                        validateOptionalDate(advisoryData.updatedDate);
                        validateDisplayedDate(advisoryData.displayedDate);
                      }}
                    />
                    {renderHelperText("month dd, yyyy")}
                  </div>
                  <div className="col-12 col-lg-1 col-md-4 ad-label">Time</div>
                  <div className="col-12 col-lg-3 col-md-8">
                    <DatePicker
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
                    {renderHelperText("hh:mm aa")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {hasAnyRole(["approver"]) && (
          <>
            <div className="row">
              <div className="col-lg-3 col-md-4 col-sm-12 ad-label bcgov-required">
                Advisory status
              </div>
              <div className="col-lg-7 col-md-8 col-sm-12">
                <div
                  className={`bcgov-select-form ${
                    advisoryStatusError !== "" ? "bcgov-select-error" : ""
                  }`}
                >
                  <Select
                    options={advisoryStatuses}
                    value={advisoryStatuses.filter(
                      (a) => a.value === advisoryStatus,
                    )}
                    onChange={(e) => setAdvisoryStatus(e ? e.value : 0)}
                    placeholder="Select an advisory status"
                    className="bcgov-select"
                    onBlur={() => {
                      validateRequiredSelect(advisoryData.advisoryStatus);
                    }}
                    isClearable
                  />
                  {renderHelperText(
                    advisoryStatusError,
                    advisoryStatusError !== "",
                  )}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-3 col-md-4 col-sm-12 ad-label bcgov-required">
                Requested by
              </div>
              <div className="col-lg-7 col-md-8 col-sm-12">
                <Form.Control
                  value={submittedBy}
                  onChange={(event) => {
                    setSubmittedBy(event.target.value);
                  }}
                  className={getControlClassName(submittedByError !== "")}
                  maxLength={255}
                  id={submitterInput.id}
                  required={submitterInput.required}
                  onBlur={() => {
                    validateRequiredText(advisoryData.submittedBy);
                  }}
                />
                {renderHelperText(
                  submittedByError && "Please enter a name",
                  submittedByError !== "",
                )}
              </div>
            </div>
          </>
        )}
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Public safety related
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
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
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4 col-sm-12 ad-label">
            Internal notes
          </div>
          <div className="col-lg-7 col-md-8 col-sm-12">
            <Form.Control
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
              }}
              className={getControlClassName(false)}
              id={notesInput.id}
              required={notesInput.required}
            />
          </div>
        </div>
        {!hasAnyRole(["approver"]) && (isStatHoliday || isAfterHours) && (
          <div className="ad-af-hour-box">
            <div className="row">
              <div className="col-lg-3 col-md-4 col-sm-12 ad-label"></div>
              <div className="col-lg-7 col-md-8 col-sm-12">
                <div className="d-flex field-bg-blue">
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="warningIcon"
                  />
                  <div className="ms-3">
                    <p>
                      <b>This is an after-hours advisory</b>
                      <br />
                      The web team business hours are
                      <br />
                      Monday to Friday, 8:30 am – 4:30 pm.
                    </p>
                    <div className="d-flex mt-3">
                      <Form.Check
                        type="radio"
                        checked={isAfterHourPublish}
                        onChange={() => {
                          setIsAfterHourPublish(true);
                        }}
                        value="Publish"
                        name="after-hour-submission"
                        aria-label="Publish immediately"
                        className="me-2"
                      />
                      <p>
                        <b className="required">
                          Urgent/safety-related advisory.
                        </b>{" "}
                        Publish immediately.
                      </p>
                    </div>
                    <div className="d-flex mt-3">
                      <Form.Check
                        type="radio"
                        checked={!isAfterHourPublish}
                        onChange={() => {
                          setIsAfterHourPublish(false);
                        }}
                        value="Review"
                        name="after-hour-submission"
                        aria-label="Submit for web team review"
                        className="me-2"
                      />
                      <p>
                        <b>Advisory is not urgent.</b> Submit for web team
                        review.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="row my-2">
          <div className="col-lg-3 col-md-4"></div>
          <div className="col-lg-7 col-md-8 col-sm-12 ad-form-error">
            {renderHelperText(formError, formError !== "")}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-md-4"></div>
          <div className="col-lg-7 col-md-8 col-sm-12 ad-btn-group">
            {!hasAnyRole(["approver"]) && (
              <>
                {mode === "create" && (
                  <>
                    <Button
                      label={
                        isStatHoliday || isAfterHours
                          ? "Submit"
                          : "Submit for approval"
                      }
                      styling="bcgov-normal-blue btn"
                      onClick={() => {
                        if (
                          validAdvisoryData(
                            advisoryData,
                            linksRef,
                            false,
                            mode,
                            linkErrorsStatus,
                          )
                        ) {
                          saveAdvisory("submit");
                        }
                      }}
                      hasLoader={isSubmitting}
                    />
                    <Button
                      label="Save draft"
                      styling="bcgov-normal-white btn"
                      onClick={() => {
                        if (
                          validAdvisoryData(
                            advisoryData,
                            linksRef,
                            false,
                            mode,
                            linkErrorsStatus,
                          )
                        ) {
                          saveAdvisory("draft");
                        }
                      }}
                      hasLoader={isSavingDraft}
                    />
                  </>
                )}
                {mode === "update" && (
                  <>
                    <Button
                      label={
                        isStatHoliday || isAfterHours
                          ? "Submit"
                          : "Submit for approval"
                      }
                      styling="bcgov-normal-blue btn"
                      onClick={() => {
                        if (
                          validAdvisoryData(
                            advisoryData,
                            linksRef,
                            false,
                            mode,
                            linkErrorsStatus,
                          )
                        ) {
                          updateAdvisory("submit");
                        }
                      }}
                      hasLoader={isSubmitting}
                    />
                    <Button
                      label="Save draft"
                      styling="bcgov-normal-white btn"
                      onClick={() => {
                        if (
                          validAdvisoryData(
                            advisoryData,
                            linksRef,
                            false,
                            mode,
                            linkErrorsStatus,
                          )
                        ) {
                          updateAdvisory("draft");
                        }
                      }}
                      hasLoader={isSavingDraft}
                    />
                  </>
                )}
              </>
            )}
            {hasAnyRole(["approver"]) && (
              <>
                {mode === "create" && (
                  <Button
                    label="Create advisory"
                    styling="bcgov-normal-blue btn"
                    onClick={() => {
                      if (
                        validAdvisoryData(
                          advisoryData,
                          linksRef,
                          true,
                          mode,
                          linkErrorsStatus,
                        )
                      ) {
                        saveAdvisory();
                      }
                    }}
                    hasLoader={isSubmitting}
                  />
                )}
                {mode === "update" && (
                  <Button
                    label="Update advisory"
                    styling="bcgov-normal-blue btn"
                    onClick={() => {
                      if (
                        validAdvisoryData(
                          advisoryData,
                          linksRef,
                          true,
                          mode,
                          linkErrorsStatus,
                        )
                      ) {
                        updateAdvisory();
                      }
                    }}
                    hasLoader={isSubmitting}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
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
    notes: PropTypes.string,
    setNotes: PropTypes.func.isRequired,
    submittedBy: PropTypes.string,
    setSubmittedBy: PropTypes.func.isRequired,
    advisoryStatuses: PropTypes.array.isRequired,
    advisoryStatus: PropTypes.string,
    setAdvisoryStatus: PropTypes.func.isRequired,
    isStatHoliday: PropTypes.bool,
    isAfterHours: PropTypes.bool,
    isAfterHourPublish: PropTypes.bool,
    setIsAfterHourPublish: PropTypes.func.isRequired,
    saveAdvisory: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    isSavingDraft: PropTypes.bool,
    updateAdvisory: PropTypes.func.isRequired,
    formError: PropTypes.string,
    setFormError: PropTypes.func.isRequired,
  }).isRequired,
};
