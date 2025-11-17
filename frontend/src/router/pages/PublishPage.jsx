import { useState } from "react";
import useConfirmation from "@/hooks/useConfirmation";
import useFlashMessage from "@/hooks/useFlashMessage";
import { useApiGet, useApiPost } from "@/hooks/useApi";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import FlashMessage from "@/components/FlashMessage";
import LoadingBar from "@/components/LoadingBar";
import NotReadyFlag from "@/components/NotReadyFlag";
import PaginationControls from "@/components/PaginationControls";
import "./PublishPage.scss";

function PublishPage() {
  // table pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  function handlePageChange(newPage) {
    setPage(newPage);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50); // slight delay
  }

  function handlePageSizeChange(newPageSize) {
    setPageSize(newPageSize);
    handlePageChange(1);
  }

  const confirmation = useConfirmation();

  const successFlash = useFlashMessage();
  const errorFlash = useFlashMessage();

  const { data, fetchData, loading, error } = useApiGet(
    "/publish/ready-to-publish/",
  );
  const { seasons = [] } = data ?? {};
  const publishableSeasons = seasons.filter((season) => season.readyToPublish);

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
    const proceed = await confirmation.open(
      "Publish dates to API?",
      "All dates that are marked ready to publish will be made public. This cannot be undone.",
      "Publish",
      "Cancel",
    );

    if (proceed) {
      try {
        // Send an array of ready-to-publish Season IDs to the API to for publishing
        const seasonIds = seasons
          .filter((season) => season.readyToPublish)
          .map((season) => season.id);

        await publishData({ seasonIds });

        successFlash.open(
          "Dates publishing to API",
          "Approved dates have been sent to the queue and publishing may take up to an hour.",
        );

        // Update the table by re-fetching the data
        await fetchData();
      } catch (publishError) {
        console.error("Error publishing to API", publishError);

        errorFlash.open(
          "Publishing failed",
          "There was an error publishing data to the API. Please try again.",
        );
      }
    }
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return (
    <div className="container publish-container">
      <div className="page publish">
        <FlashMessage
          title={successFlash.title}
          message={successFlash.message}
          isVisible={successFlash.isOpen}
          onClose={successFlash.close}
        />

        <FlashMessage
          title={errorFlash.title}
          message={errorFlash.message}
          isVisible={errorFlash.isOpen}
          onClose={errorFlash.close}
          variant="error"
        />

        <ConfirmationDialog {...confirmation.props} />

        <div className="d-flex justify-content-end mb-2">
          <button
            onClick={publishToApi}
            disabled={saving || publishableSeasons.length === 0}
            className="btn btn-primary"
          >
            Publish to API
          </button>

          {saving && (
            <span
              className="spinner-border text-primary align-self-center me-2"
              aria-hidden="true"
            ></span>
          )}
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
                <tr key={season.id}>
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
                    {season.operatingYear}
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
          onPageChange={handlePageChange}
          pageSizeLabel="Rows per page"
        />
      </div>
    </div>
  );
}

export default PublishPage;
