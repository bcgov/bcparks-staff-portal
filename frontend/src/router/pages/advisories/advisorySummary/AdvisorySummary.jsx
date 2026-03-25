import { useState, useEffect, useContext } from "react";
import {
  Navigate,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import ErrorContext from "@/contexts/ErrorContext";
import CmsDataContext from "@/contexts/CmsDataContext";
import { cmsAxios } from "@/lib/advisories/axios_config";
import { useAuth } from "react-oidc-context";
import "./AdvisorySummary.css";
import { Loader } from "@/components/advisories/shared/loader/Loader";
import Alert from "@mui/material/Alert";
import { Snackbar, Link } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Button } from "@/components/advisories/shared/button/Button";
import { getLinkTypes } from "@/lib/advisories/utils/CmsDataUtil";
import AdvisorySummaryView from "@/components/advisories/composite/advisorySummaryView/AdvisorySummaryView";

export default function AdvisorySummary() {
  const { setError } = useContext(ErrorContext);
  const { cmsData, setCmsData } = useContext(CmsDataContext);
  const auth = useAuth();
  const keycloakToken = auth.user?.access_token;
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
  const [snackMessageInfo, setSnackMessageInfo] = useState(undefined);
  const { documentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const confirmationText = location.state?.confirmationText;
  const index = location.state?.index;
  const [isCurrentlyPublished, setIsCurrentlyPublished] = useState(false);
  const [showOriginalAdvisory, setShowOriginalAdvisory] = useState(false);
  const [currentAdvisory, setCurrentAdvisory] = useState({});
  const [currentParkUrls, setCurrentParkUrls] = useState("");
  const [currentSiteUrls, setCurrentSiteUrls] = useState("");

  useEffect(() => {
    if (!isLoadingPage) {
      if (showOriginalAdvisory) {
        Promise.all([
          cmsAxios.get(
            `/public-advisories/${advisory.advisoryNumber}?populate=*`,
          ),
          getLinkTypes(cmsData, setCmsData),
        ])
          .then((res) => {
            const advisoryData = res[0].data;

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
          })
          .catch((error) => {
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
    showOriginalAdvisory,
  ]);

  useEffect(() => {
    if (documentId) {
      Promise.all([
        cmsAxios.get(`public-advisory-audits/${documentId}?populate=*`, {
          headers: { Authorization: `Bearer ${keycloakToken}` },
        }),
        getLinkTypes(cmsData, setCmsData),
      ])
        .then((res) => {
          const advisoryData = res[0].data.data;

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
          console.log("error occurred fetching Public Advisory data", error);
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
    keycloakToken,
    showOriginalAdvisory,
  ]);

  const handleMenuChange = (event, val) => {
    switch (val) {
      case 0:
        navigate("/advisories");
        break;
      case 1:
        navigate("/park-access-status");
        break;
      case 2:
        navigate("/activities-and-facilities");
        break;
      default:
        navigate("/");
    }
  };

  const handleOpenSnackBar = (message) => {
    setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
  };

  const handleCloseSnackBar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnack(false);
  };

  const handleExitedSnackBar = () => {
    setSnackMessageInfo(undefined);
  };

  if (toDashboard) {
    return (
      <Navigate
        push
        to={{
          pathname: `/advisories`,
          index: index >= 0 ? index : 0,
        }}
      />
    );
  }

  if (toUpdate) {
    return <Navigate to={`/update-advisory/${documentId}`} />;
  }

  if (toError) {
    return <Navigate to="/error" />;
  }

  return (
    <main className="advisories-styles">
      <div className="AdvisorySummary" data-testid="AdvisorySummary">
        <div className="container">
          {isLoadingPage && (
            <div className="page-loader">
              <Loader page />
            </div>
          )}
          {!isLoadingPage && (
            <div>
              <div>
                <div className="container-fluid">
                  <button
                    type="button"
                    className="btn btn-link btn-back mt-4"
                    onClick={() => {
                      setToDashboard(true);
                    }}
                  >
                    <ArrowBackIcon />
                    Back to public advisories
                  </button>
                </div>
                {!showOriginalAdvisory && (
                  <div className="container-fluid ad-summary mt-4">
                    {confirmationText && (
                      <Alert severity="success">{confirmationText}</Alert>
                    )}
                    {isCurrentlyPublished && (
                      <div className="container-fluid ad-right mt-4">
                        <Link
                          component="button"
                          onClick={() => {
                            setShowOriginalAdvisory(true);
                          }}
                        >
                          View published version
                        </Link>
                      </div>
                    )}
                    <div className="mt-5 container-fluid ad-form">
                      <div className="row title">
                        <div className="col-md-8 col-12">
                          <p>Advisory #{advisory.advisoryNumber}</p>
                          <h4>{advisory.title}</h4>
                        </div>
                        <div className="col-md-4 col-12 d-flex align-items-center justify-content-end">
                          <Button
                            label="Edit advisory"
                            styling="bcgov-normal-blue btn mt10"
                            onClick={() => {
                              setToUpdate(true);
                            }}
                          />
                        </div>
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
                {showOriginalAdvisory && (
                  <div className="container-fluid ad-summary col-lg-9 col-md-12 col-12">
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-12 ad-right">
                        <Link
                          component="button"
                          onClick={() => {
                            setShowOriginalAdvisory(false);
                          }}
                        >
                          View recent update
                        </Link>
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
              <Snackbar
                key={snackMessageInfo ? snackMessageInfo.key : undefined}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                open={openSnack}
                autoHideDuration={3000}
                onClose={handleCloseSnackBar}
                onExited={handleExitedSnackBar}
              >
                <Alert onClose={handleCloseSnackBar} severity="info">
                  {snackMessageInfo ? snackMessageInfo.message : undefined}
                </Alert>
              </Snackbar>
            </div>
          )}
        </div>
        <br />
      </div>
    </main>
  );
}
