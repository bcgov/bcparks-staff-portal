import { useParams } from "react-router-dom";
import { useApiGet } from "@/hooks/useApi";
import NavBack from "@/components/NavBack";
import LoadingBar from "@/components/LoadingBar";
import SubArea from "@/components/ParkDetailsSubArea";
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

  function renderSubAreas() {
    if (loading) {
      return <LoadingBar />;
    }

    if (error) {
      return <p>Error loading parks data: {error.message}</p>;
    }

    return getSubAreas(park);
  }

  return (
    <div className="page park-details">
      <NavBack routePath={"/"}>Back to Dates management</NavBack>

      <header className="page-header internal">
        <h1>{park?.name}</h1>
      </header>

      {renderSubAreas()}
    </div>
  );
}

export default ParkDetails;
