import { useState, useEffect, useContext } from "react";
import classNames from "classnames";
import useConfirmation from "@/hooks/useConfirmation";
import FlashMessageContext from "@/contexts/FlashMessageContext";
import { useApiGet, useApiPost } from "@/hooks/useApi";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import LoadingBar from "@/components/LoadingBar";
import { ActionButton } from "@/components/ActionButton";
import NotReadyFlag from "@/apps/dates/components/NotReadyFlag";
import PaginationControls from "@/components/PaginationControls";
import * as SEASON_TYPE from "@/apps/dates/constants/seasonType";
import "./PublishPage.scss";

function formatSeasonType(seasonType, publishableType) {
  if (seasonType !== SEASON_TYPE.WINTER) {
    return "";
  }

  return publishableType === "feature" || publishableType === "parkArea"
    ? "Winter fee (calculated)"
    : "";
}

function PublishPage() {
  // table pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Scroll to top after page changes
  useEffect(() => {
    let cancelled = false;

    // double rAF helps iOS Safari reliability
    const af1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(af1);
    };
  }, [page]);

  function handlePageSizeChange(newPageSize) {
    setPageSize(newPageSize);
    setPage(1);
  }

  const confirmation = useConfirmation();

  const globalFlashMessage = useContext(FlashMessageContext);

  const { data, fetchData, loading, error } = useApiGet(
    "/publish/ready-to-publish/",
  );
  const { seasons = [] } = data ?? {};
  const hasPublishableSeasons = seasons.some((season) => season.readyToPublish);

  const { sendData: publishData, loading: saving } = useApiPost(
    "/publish/publish-to-api/",
  );

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
        <div>Error loading data: {error.message}</div>
      </div>
    );
  }

  async function publishToApi() {
    const proceed = await confirmation.open({
      title: "Publish dates to API?",
      message:
        "All dates that are marked ready to publish will be made public. This cannot be undone.",
      confirmButtonText: "Publish",
      cancelButtonText: "Cancel",
    });

    if (proceed) {
      try {
        // Send an array of ready-to-publish Season IDs to the API to for publishing
        const seasonIds = seasons
          .filter((season) => season.readyToPublish)
          .map((season) => season.id);

        await publishData({ seasonIds });

        globalFlashMessage.open(
          "Dates publishing to API",
          "Approved dates have been sent to the queue and publishing may take up to an hour.",
        );

        // Update the table by re-fetching the data
        await fetchData();
      } catch (publishError) {
        console.error("Error publishing to API", publishError);

        globalFlashMessage.open(
          "Publishing failed",
          "There was an error publishing data to the API. Please try again.",
          { variant: "error" },
        );
      }
    }
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return (
    <div className="container publish-container">
      <div className="page publish">
        <ConfirmationDialog {...confirmation.props} />

        <div
          className={classNames(
            "d-flex",
            "flex-column",
            "flex-sm-row",
            "gap-2",
            "gap-sm-0",
            "justify-content-end",
            "mb-2",
          )}
        >
          <ActionButton
            label="Publish to API"
            onClick={publishToApi}
            disabled={saving || !hasPublishableSeasons}
            hasLoader={saving}
          />
        </div>

        <div className="table-responsive flex-fill">
          <table className="table table-striped table-publish">
            <thead>
              <tr>
                <th scope="col">Park name</th>
                <th scope="col">Area</th>
                <th scope="col">Feature</th>
                <th scope="col">Year</th>
              </tr>
            </thead>
            <tbody>
              {seasons.slice(startIndex, endIndex).map((season) => (
                <tr key={`${season.id}-${season.sortIndex}`}>
                  <td>{season.parkName}</td>
                  <td className="fw-bold">{season.parkAreaName}</td>
                  <td>
                    <ul className="list-unstyled mb-0">
                      {season.featureNames.map((name, index) => (
                        <li key={index}>{name}</li>
                      ))}
                      {season.featureNames.length === 0 && <li>-</li>}
                    </ul>
                  </td>
                  <td>
                    {season.displayOperatingYear}{" "}
                    {formatSeasonType(
                      season.seasonType,
                      season.publishableType,
                    )}
                    <NotReadyFlag show={!season.readyToPublish} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {seasons.length === 0 && (
            <div className="text-center my-4">
              There are no approved dates to publish.
            </div>
          )}
        </div>

        <PaginationControls
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          currentPage={page}
          totalItems={seasons.length}
          onPageChange={setPage}
          pageSizeLabel="Rows per page"
        />
      </div>
    </div>
  );
}

export default PublishPage;
