import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

import { useApiGet } from "@/hooks/useApi";
import useValidation from "@/hooks/useValidation";

import LoadingBar from "@/components/LoadingBar";

export default function SeasonPage() {
  // Render the SubmitDates (edit form) or PreviewDates (read-only) component
  // based on the current route. Provide the same date to either route
  // and allow switching back and forth.

  const { parkId, seasonId } = useParams();
  const navigate = useNavigate();

  const [season, setSeason] = useState(null);
  const [dates, setDates] = useState(null);
  const [readyToPublish, setReadyToPublish] = useState(false);
  const [notes, setNotes] = useState("");

  const validation = useValidation(dates, notes, season);

  const { data, loading, error } = useApiGet(`/seasons/${seasonId}`);

  useEffect(() => {
    if (data) {
      const currentSeasonDates = {};

      data.campgrounds.forEach((campground) => {
        campground.features.forEach((feature) => {
          currentSeasonDates[feature.dateable.id] = {
            Operation: [],
            Reservation: [],
          };
          feature.dateable.currentSeasonDates.forEach((dateRange) => {
            currentSeasonDates[feature.dateable.id][
              dateRange.dateType.name
            ].push({
              ...dateRange,
              dateableId: feature.dateable.id,
              inputType: "text",
              changed: false,
            });
          });
        });
      });

      data.features.forEach((feature) => {
        currentSeasonDates[feature.dateable.id] = {
          Operation: [],
          Reservation: [],
        };
        feature.dateable.currentSeasonDates.forEach((dateRange) => {
          currentSeasonDates[feature.dateable.id][dateRange.dateType.name].push(
            {
              ...dateRange,
              dateableId: feature.dateable.id,
              inputType: "text",
              changed: false,
            },
          );
        });
      });

      setSeason(data);
      setDates(currentSeasonDates);
      setReadyToPublish(data.readyToPublish);
    }
  }, [data]);

  // Navigates to a new route and scrolls to the top of the page
  function navigateAndScroll(to) {
    navigate(to);
    window.scrollTo(0, 0);
  }

  if (loading || !season) {
    return (
      <div className="container">
        <LoadingBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p>Error loading season data: {error.message}</p>
      </div>
    );
  }

  return (
    <Outlet
      context={{
        parkId,
        seasonId,
        season,
        dates,
        setDates,
        notes,
        setNotes,
        readyToPublish,
        setReadyToPublish,
        validation,
        navigate,
        navigateAndScroll,
      }}
    />
  );
}
