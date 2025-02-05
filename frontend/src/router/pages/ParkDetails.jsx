import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

    let seasonId = searchParams.get("approved");

    if (!park || seasonId === null) return;
    seasonId = Number(seasonId);

    // Remove the query string so the flash message won't show again
    searchParams.delete("approved");
    setSearchParams(searchParams);

    // Find the season in the park data by its ID
    const allSeasons = [
      ...Object.values(park.featureTypes).flat(),
      ...park.winterFees,
    ];
    const approvedSeason = allSeasons.find((season) => season.id === seasonId);

    if (!approvedSeason) return;

    openFlashMessage(
      "Dates approved",
      `${park.name} ${approvedSeason.featureType.name} ${approvedSeason.operatingYear} season dates marked approved`,
    );
  }, [isFlashOpen, park, searchParams, setSearchParams, openFlashMessage]);

  if (loading) {
    return <LoadingBar />;
  }

  if (error) {
    return <p>Error loading parks data: {error.message}</p>;
  }

  return (
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
            getEditRoutePath: (seasonId) => `/park/${parkId}/edit/${seasonId}`,
            getPreviewRoutePath: (seasonId) =>
              `/park/${parkId}/edit/${seasonId}/preview`,
            getTitle: (season) => `${season.operatingYear} season`,
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
          getEditRoutePath: (seasonId) =>
            `/park/${parkId}/winter-fees/${seasonId}/edit`,
          getPreviewRoutePath: (seasonId) =>
            `/park/${parkId}/winter-fees/${seasonId}/preview`,
          getTitle: (season) =>
            `${season.operatingYear} – ${season.operatingYear + 1}`,
          DetailsComponent: WinterFeesDates,
        }}
      />
    </div>
  );
}

export default ParkDetails;
