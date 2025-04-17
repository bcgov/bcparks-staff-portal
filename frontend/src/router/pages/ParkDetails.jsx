import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import paths from "@/router/paths";
import { useApiGet } from "@/hooks/useApi";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import NavBack from "@/components/NavBack";
import LoadingBar from "@/components/LoadingBar";
import FeatureType from "@/components/ParkDetailsFeatureType";
import FlashMessage from "@/components/FlashMessage";
import SeasonDates from "@/components/ParkDetailsSeasonDates";
import WinterFeesDates from "@/components/ParkDetailsWinterFeesDates";
import "./ParkDetails.scss";

function ParkDetails() {
  const { parkId } = useParams();
  const { data: park, loading, error } = useApiGet(`/parks/${parkId}`);

  const [searchParams, setSearchParams] = useSearchParams();

  const {
    flashTitle,
    flashMessage,
    openFlashMessage,
    handleFlashClose,
    isFlashOpen,
  } = useFlashMessage();

  // Show a flash message if the user just approved dates
  useEffect(() => {
    if (isFlashOpen) return;

    const approvedSeasonId = searchParams.get("approved");
    const savedSeasonId = searchParams.get("saved");
    const submittedSeasonId = searchParams.get("submitted");

    let seasonId = null;

    if (approvedSeasonId !== null) {
      seasonId = approvedSeasonId;
    } else if (savedSeasonId !== null) {
      seasonId = savedSeasonId;
    } else if (submittedSeasonId !== null) {
      seasonId = submittedSeasonId;
    }

    if (!park || seasonId === null) return;
    seasonId = Number(seasonId);

    // Remove the query string so the flash message won't show again
    searchParams.delete("approved");
    searchParams.delete("saved");
    searchParams.delete("submitted");
    setSearchParams(searchParams, { replace: true });

    // Find the season in the park data by its ID
    const allSeasons = [
      ...Object.values(park.featureTypes).flat(),
      ...park.winterFees,
    ];
    const season = allSeasons.find((item) => item.id === seasonId);

    if (!season) return;

    const featureTypeDisplay = season.featureType.name.toLocaleLowerCase();

    if (approvedSeasonId !== null) {
      openFlashMessage(
        "Dates approved",
        `${park.name} ${featureTypeDisplay} ${season.operatingYear} dates marked as approved`,
      );
    } else if (savedSeasonId !== null) {
      openFlashMessage(
        "Dates saved as draft",
        `${park.name} ${featureTypeDisplay} ${season.operatingYear} dates saved`,
      );
    }
  }, [isFlashOpen, park, searchParams, setSearchParams, openFlashMessage]);

  if (loading) {
    return (
      <div className="container">
        <LoadingBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p>Error loading parks data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page park-details">
        <FlashMessage
          title={flashTitle}
          message={flashMessage}
          isVisible={isFlashOpen}
          onClose={handleFlashClose}
        />

        <NavBack routePath={"/"}>Back to Dates management</NavBack>

        <header className="page-header internal">
          <h1>{park?.name}</h1>
        </header>

        {Object.entries(park.featureTypes).map(([title, seasons]) => (
          <FeatureType
            key={title}
            title={title}
            icon={seasons[0].featureType.icon}
            seasons={seasons}
            seasonProps={{
              getDataEndpoint: (seasonId) => `/seasons/${seasonId}`,
              getEditRoutePath: paths.seasonEdit,
              getReviewRoutePath: paths.seasonReview,
              getTitle: (season) => `${season.operatingYear} dates`,
              DetailsComponent: SeasonDates,
            }}
          />
        ))}

        {/* Render Winter fee seasons separately from "regular" seasons
            and use a specific season component */}
        <FeatureType
          title="Winter fee"
          icon="winter-recreation"
          seasons={park.winterFees}
          seasonProps={{
            getDataEndpoint: (seasonId) => `/winter-fees/${seasonId}`,
            getEditRoutePath: paths.winterFeesEdit,
            getReviewRoutePath: paths.winterFeesReview,
            getTitle: (season) =>
              `${season.operatingYear} – ${season.operatingYear + 1}`,
            DetailsComponent: WinterFeesDates,
          }}
        />
      </div>
    </div>
  );
}

export default ParkDetails;
