import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import {
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { format } from "date-fns";
import ErrorContext from "@/contexts/ErrorContext";
import CmsDataContext from "@/contexts/CmsDataContext";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import useCms from "@/hooks/useCms";
import { useAuth } from "react-oidc-context";
import "./AdvisorySummary.scss";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import Alert from "react-bootstrap/Alert";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fa-kit/icons/classic/solid";
import {
  faCircleCheck,
  faEyeSlash,
  faPen,
} from "@fa-kit/icons/classic/regular";
import { Button } from "@/components/advisories/shared/button/Button";
import { getLinkTypes } from "@/lib/advisories/utils/CmsDataUtil";
import { getAdvisoryStatuses } from "@/lib/advisories/utils/CmsDataUtil";
import AdvisorySummaryView from "@/components/advisories/composite/advisorySummaryView/AdvisorySummaryView";
import StatusBadge from "@/components/StatusBadge";
import useAccess from "@/hooks/useAccess";
import useAdvisoryMarkReviewed from "@/hooks/advisories/useAdvisoryMarkReviewed";
import useAdvisoryUnpublish from "@/hooks/advisories/useAdvisoryUnpublish";

export default function AdvisorySummary() {
  const { setError } = useContext(ErrorContext);
  const { cmsData, setCmsData } = useContext(CmsDataContext);
  const globalFlashMessage = useContext(FlashMessageContext);
  const auth = useAuth();
  const { hasAnyRole, ROLES } = useAccess();
  const { cmsGet } = useCms();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [toError, setToError] = useState(false);
  const [advisory, setAdvisory] = useState({});
  const [parkUrls, setParkUrls] = useState("");
  const [siteUrls, setSiteUrls] = useState("");
  const [toDashboard, setToDashboard] = useState(false);
  const [toUpdate, setToUpdate] = useState(false);
  const [snackPack, setSnackPack] = useState([]);
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessageInfo, setSnackMessageInfo] = useState(null);
  const { documentId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [confirmationText] = useState(location.state?.confirmationText || "");
  const index = location.state?.index;
  const [isCurrentlyPublished, setIsCurrentlyPublished] = useState(false);
  const [showOriginalAdvisory, setShowOriginalAdvisory] = useState(false);
  const [originalIsLoaded, setOriginalIsLoaded] = useState(false);
  const [currentAdvisory, setCurrentAdvisory] = useState({});
  const [currentParkUrls, setCurrentParkUrls] = useState("");
  const [currentSiteUrls, setCurrentSiteUrls] = useState("");
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);

  const isRequestingCms = useMemo(
    () => isUnpublishing || isMarkingReviewed,
    [isUnpublishing, isMarkingReviewed],
  );

  useEffect(() => {
    if (!isLoadingPage) {
      if (showOriginalAdvisory) {
        setOriginalIsLoaded(false);
        Promise.all([
          cmsGet(`/public-advisories/${advisory.advisoryNumber}?populate=*`),
          getLinkTypes(cmsData, setCmsData),
        ])
          .then((res) => {
            const advisoryData = res[0];

            advisoryData.linkTypes = res[1];
            setIsCurrentlyPublished(advisoryData.advisoryStatus.code === "PUB");
            setCurrentAdvisory(advisoryData);
            const parkUrlInfo = [];
            const siteUrlInfo = [];

            advisoryData.protectedAreas.map((p) => {
              if (p.url) {
                return parkUrlInfo.push(p.url);
              }
              return parkUrlInfo.push(p.protectedAreaName);
            });
            const parkUrlText = parkUrlInfo.join("<br/>");

            setCurrentParkUrls(parkUrlText);
            advisoryData.sites.map((s) => {
              if (s.url) {
                return siteUrlInfo.push(s.url);
              }
              return siteUrlInfo.push(s.siteName);
            });
            const siteUrlText = siteUrlInfo.join("\n");

            setCurrentSiteUrls(siteUrlText);
            setOriginalIsLoaded(true);
          })
          .catch(() => {
            // Do nothing
          });
      }
    }
  }, [
    advisory,
    cmsData,
    isLoadingPage,
    setCmsData,
    setCurrentAdvisory,
    setIsCurrentlyPublished,
    setCurrentParkUrls,
    setCurrentSiteUrls,
    setOriginalIsLoaded,
    showOriginalAdvisory,
    cmsGet,
  ]);

  useEffect(() => {
    if (documentId) {
      Promise.all([
        cmsGet(`public-advisory-audits/${documentId}?populate=*`),
        getLinkTypes(cmsData, setCmsData),
        getAdvisoryStatuses(cmsData, setCmsData),
      ])
        .then((res) => {
          const advisoryData = res[0];

          advisoryData.linkTypes = res[1];
          setAdvisory(advisoryData);
          const parkUrlInfo = [];
          const siteUrlInfo = [];
          const isAdvisoryPublished =
            advisoryData.advisoryStatus.code === "PUB";

          advisoryData.protectedAreas.map((p) => {
            if (p.url) {
              return parkUrlInfo.push(p.url);
            }
            return parkUrlInfo.push(p.protectedAreaName);
          });
          const parkUrlText = parkUrlInfo.join("\n");

          setParkUrls(parkUrlText);
          setIsPublished(isAdvisoryPublished);
          advisoryData.sites.map((s) => {
            if (s.url) {
              return siteUrlInfo.push(s.url);
            }
            return siteUrlInfo.push(s.siteName);
          });
          const siteUrlText = siteUrlInfo.join("\n");

          setSiteUrls(siteUrlText);
          setIsLoadingPage(false);
        })
        .catch((error) => {
          console.error("error occurred fetching Public Advisory data", error);
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
    if (snackPack.length && !snackMessageInfo) {
      // Set a new snack when we don't have an active one
      setSnackMessageInfo({ ...snackPack[0] });
      setSnackPack((prev) => prev.slice(1));
      setOpenSnack(true);
    } else if (snackPack.length && snackMessageInfo && openSnack) {
      // Close an active snack when a new one is added
      setOpenSnack(false);
    }
  }, [
    documentId,
    setError,
    setToError,
    setIsLoadingPage,
    setAdvisory,
    setParkUrls,
    setSiteUrls,
    setIsPublished,
    snackPack,
    openSnack,
    snackMessageInfo,
    cmsData,
    setCmsData,
    cmsGet,
    showOriginalAdvisory,
  ]);

  function handleOpenSnackBar(message) {
    setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
  }

  // Shows an error flash message if unpublishing fails.
  const openUnpublishError = useCallback(
    (message) => {
      setIsUnpublishing(false);
      globalFlashMessage.open(
        "Failed to unpublish advisory / closure",
        message,
        {
          variant: "error",
        },
      );
    },
    [globalFlashMessage],
  );

  // Shows a success flash message when unpublishing succeeds.
  const openUnpublishSuccess = useCallback(
    (message) => {
      setIsUnpublishing(false);
      globalFlashMessage.open("Unpublished advisory / closure", message, {
        variant: "success",
      });
    },
    [globalFlashMessage],
  );

  // Shows an error flash message if marking reviewed fails.
  const openMarkReviewedError = useCallback(
    (message) => {
      setIsMarkingReviewed(false);
      globalFlashMessage.open(
        "Failed to mark advisory / closure reviewed",
        message,
        {
          variant: "error",
        },
      );
    },
    [globalFlashMessage],
  );

  // Shows a success flash message when marking reviewed succeeds.
  const openMarkReviewedSuccess = useCallback(
    (message) => {
      setIsMarkingReviewed(false);
      globalFlashMessage.open("Marked advisory / closure reviewed", message, {
        variant: "success",
      });
    },
    [globalFlashMessage],
  );

  // Re-fetches advisory data after status-changing actions.
  const refreshAdvisorySummary = useCallback(async () => {
    if (documentId) {
      try {
        const [advisoryData, linkTypes] = await Promise.all([
          cmsGet(`public-advisory-audits/${documentId}?populate=*`),
          getLinkTypes(cmsData, setCmsData),
        ]);

        advisoryData.linkTypes = linkTypes;
        setAdvisory(advisoryData);
      } catch (error) {
        console.error("Error refreshing advisory after unpublish:", error);
      }
    }
  }, [documentId, cmsGet, cmsData, setCmsData]);

  // Extract advisory statuses from cmsData
  const advisoryStatuses = cmsData?.advisoryStatuses || [];

  const unpublishAdvisory = useAdvisoryUnpublish({
    advisoryStatuses,
    modifiedBy: auth.user?.profile?.name,
    isApprover: hasAnyRole([ROLES.ADVISORY_APPROVER]),
    openUnpublishError,
    openUnpublishSuccess,
    onSuccess: refreshAdvisorySummary,
  });

  const markReviewedAdvisory = useAdvisoryMarkReviewed({
    advisoryStatuses,
    reviewedByName: auth.user?.profile?.name,
    openMarkReviewedError,
    openMarkReviewedSuccess,
    onSuccess: refreshAdvisorySummary,
  });

  // Undefined, or a 3-letter code
  const advisoryStatusCode = useMemo(
    () => advisory?.advisoryStatus?.code,
    [advisory?.advisoryStatus?.code],
  );

  // The URL to the update page, including the "tab" search param if it exists
  const updateAdvisoryUrl = useMemo(() => {
    const baseUrl = `/update-advisory/${documentId}`;

    return tabParam
      ? `${baseUrl}?tab=${encodeURIComponent(tabParam)}`
      : baseUrl;
  }, [documentId, tabParam]);

  // Formatted string for "Last updated..." timestamp
  const lastUpdatedString = useMemo(() => {
    if (!advisory.modifiedDate) return null;

    const modifiedDate = format(
      advisory.modifiedDate,
      "EEE, MMMM dd, yyyy h:mm aaa",
    );
    const modifiedBy = advisory.modifiedBy ? ` by ${advisory.modifiedBy}` : "";

    return `Last updated ${modifiedDate}${modifiedBy}`;
  }, [advisory.modifiedDate, advisory.modifiedBy]);

  // Formatted string for "Posted..." timestamp, if any
  const postingDateString = useMemo(() => {
    if (!advisory.advisoryDate) return null;

    // Only display for published or scheduled advisories
    if (advisoryStatusCode !== "SCH" && advisoryStatusCode !== "PUB") return "";

    const prefix = advisoryStatusCode === "PUB" ? "Posted" : "Posting";

    return `${prefix} ${format(advisory.advisoryDate, "EEE, MMMM dd, yyyy h:mm aaa")}`;
  }, [advisory.advisoryDate, advisoryStatusCode]);

  // Determine if the advisory can be unpublished
  const canUnpublish = useMemo(() => {
    // Status must be "Scheduled" or "Published"
    if (advisoryStatusCode !== "SCH" && advisoryStatusCode !== "PUB")
      return false;

    return true;
  }, [advisoryStatusCode]);

  // Only approvers can mark advisories/closures as reviewed
  const canMarkReviewed = hasAnyRole([ROLES.ADVISORY_APPROVER]);

  /**
   * Handles the "unpublish" action. Sends a request to the CMS to unpublish the
   * advisory via the useUnpublishAdvisory hook.
   * @returns {void}
   */
  function handleUnpublish() {
    if (!canUnpublish) return;

    setIsUnpublishing(true);
    unpublishAdvisory({
      documentId: advisory.documentId,
      title: advisory.title,
    });
  }

  /**
   * Handles the "mark reviewed" action. Sends a request to the CMS to mark the advisory
   * as reviewed via the useAdvisoryMarkReviewed hook.
   * @returns {void}
   */
  function handleMarkReviewed() {
    if (!canMarkReviewed) return;

    // Skip if the advisory isn't loaded yet
    if (!advisory?.documentId) return;

    setIsMarkingReviewed(true);
    markReviewedAdvisory(advisory);
  }

  function handleCloseSnackBar(_, reason) {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnack(false);
  }

  function handleExitedSnackBar() {
    setSnackMessageInfo(null);
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
          index: index >= 0 ? index : 0,
        }}
      />
    );
  }

  if (toUpdate) {
    return <Navigate to={updateAdvisoryUrl} />;
  }

  if (toError) {
    return <Navigate to="/error" />;
  }

  return (
    <main className="advisories-styles">
      <div className="advisory-summary" data-testid="AdvisorySummary">
        <div className="container">
          {isLoadingPage && (
            <div className="page-loader">
              <Loader page />
            </div>
          )}
          {!isLoadingPage && (
            <div>
              <div className="position-relative">
                <div>
                  <button
                    type="button"
                    className="btn btn-link btn-back my-4"
                    onClick={() => {
                      setToDashboard(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back to advisories and closures dashboard
                  </button>
                </div>
                {!showOriginalAdvisory && (
                  <div className="act-summary mt-4">
                    {confirmationText && (
                      <Alert variant="success">{confirmationText}</Alert>
                    )}
                    {isCurrentlyPublished && (
                      <div className="act-right mt-4">
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={() => {
                            setOriginalIsLoaded(false);
                            setShowOriginalAdvisory(true);
                          }}
                        >
                          View published version
                        </button>
                      </div>
                    )}

                    <div className="container-fluid g-0 act-form">
                      <div className="row g-0 title">
                        <div className="col-12">
                          <p className="mb-1">
                            Advisory #{advisory.advisoryNumber}
                            <StatusBadge
                              status={advisoryStatusCode}
                              className="ms-2 advisory-status-badge"
                            ></StatusBadge>
                          </p>
                          <h2>{advisory.title}</h2>

                          {postingDateString && (
                            <p className="mb-2">{postingDateString}</p>
                          )}

                          {lastUpdatedString && <p>{lastUpdatedString}</p>}
                        </div>
                      </div>

                      <div className="actions mb-4 d-flex gap-2 align-items-start justify-content-center justify-content-xl-end flex-wrap flex-xl-nowrap">
                        {canMarkReviewed && (
                          <Button
                            label="Mark reviewed"
                            styling="btn-outline-primary btn flex-shrink-0"
                            disabled={isRequestingCms}
                            onClick={handleMarkReviewed}
                            hasLoader={isMarkingReviewed}
                            leftIcon={<FontAwesomeIcon icon={faCircleCheck} />}
                          />
                        )}

                        <Button
                          label="Unpublish"
                          styling="btn-outline-primary btn flex-shrink-0"
                          disabled={isRequestingCms || !canUnpublish}
                          onClick={handleUnpublish}
                          hasLoader={isUnpublishing}
                          leftIcon={<FontAwesomeIcon icon={faEyeSlash} />}
                        />

                        <Button
                          label="Edit"
                          styling="btn-primary btn flex-shrink-0"
                          disabled={isUnpublishing}
                          onClick={() => {
                            setToUpdate(true);
                          }}
                          leftIcon={<FontAwesomeIcon icon={faPen} />}
                        />
                      </div>

                      <AdvisorySummaryView
                        data={{
                          advisory,
                          isPublished,
                          parkUrls,
                          siteUrls,
                          handleOpenSnackBar,
                          showOriginalAdvisory,
                        }}
                      />
                    </div>
                  </div>
                )}
                {showOriginalAdvisory && originalIsLoaded && (
                  <div className="container-fluid act-summary col-lg-9 col-md-12 col-12">
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-12 act-right">
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={() => {
                            setOriginalIsLoaded(false);
                            setShowOriginalAdvisory(false);
                          }}
                        >
                          View recent update
                        </button>
                      </div>
                    </div>
                    <AdvisorySummaryView
                      data={{
                        advisory: currentAdvisory,
                        isPublished: isCurrentlyPublished,
                        parkUrls: currentParkUrls,
                        siteUrls: currentSiteUrls,
                        handleOpenSnackBar,
                        showOriginalAdvisory,
                      }}
                    />
                  </div>
                )}
              </div>
              <ToastContainer
                position="bottom-start"
                className="p-3 position-fixed"
              >
                <Toast
                  key={snackMessageInfo ? snackMessageInfo.key : null}
                  show={openSnack}
                  onClose={handleCloseSnackBar}
                  onExited={handleExitedSnackBar}
                  delay={3000}
                  autohide
                >
                  <Toast.Body>
                    {snackMessageInfo ? snackMessageInfo.message : null}
                  </Toast.Body>
                </Toast>
              </ToastContainer>
            </div>
          )}
        </div>
        <br />
      </div>
    </main>
  );
}
