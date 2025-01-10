import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useApiGet } from "@/hooks/useApi";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import NavBack from "@/components/NavBack";
import LoadingBar from "@/components/LoadingBar";
import SubArea from "@/components/ParkDetailsSubArea";
import FlashMessage from "@/components/FlashMessage";
import "./ParkDetails.scss";

// Returns an array of sub-area components
function getSubAreas(park) {
  if (!park) return [];

  return Object.entries(park.subAreas).map(([title, subAreaSeason]) => (
    <SubArea key={title} title={title} seasons={subAreaSeason} />
  ));
}

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

  function renderSubAreas() {
    if (loading) {
      return <LoadingBar />;
    }

    if (error) {
      return <p>Error loading parks data: {error.message}</p>;
    }

    return getSubAreas(park);
  }

  // Show a flash message if the user just approved dates
  useEffect(() => {
    if (isFlashOpen) return;

    let featureId = searchParams.get("approved");

    if (!park || featureId === null) return;
    featureId = Number(featureId);

    // Remove the query string so the flash message won't show again
    searchParams.delete("approved");
    setSearchParams(searchParams);

    // Find the feature in the park data by its ID
    const allFeatures = Object.values(park.subAreas).flat();
    const approvedFeature = allFeatures.find(
      (feature) => feature.id === featureId,
    );

    if (!approvedFeature) return;

    openFlashMessage(
      "Dates approved",
      `${park.name} ${approvedFeature.featureType.name} ${approvedFeature.operatingYear} season dates marked approved`,
    );
  });

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

      {renderSubAreas()}
    </div>
  );
}

export default ParkDetails;
