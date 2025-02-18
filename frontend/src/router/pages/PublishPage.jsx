import { useConfirmation } from "@/hooks/useConfirmation";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { useApiGet, useApiPost } from "@/hooks/useApi";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import FlashMessage from "@/components/FlashMessage";
import LoadingBar from "@/components/LoadingBar";
import NotReadyFlag from "@/components/NotReadyFlag";

function PublishPage() {
  const {
    title,
    message,
    confirmButtonText,
    cancelButtonText,
    confirmationDialogNotes,
    openConfirmation,
    handleConfirm,
    handleCancel,
    isConfirmationOpen,
  } = useConfirmation();

  const {
    flashTitle,
    flashMessage,
    openFlashMessage,
    handleFlashClose,
    isFlashOpen,
  } = useFlashMessage();

  const { data, loading, error } = useApiGet("/publish/ready-to-publish/");

  const {
    sendData: publishData,
    // error: saveError, // @TODO: handle save errors
    loading: saving,
  } = useApiPost("/publish/publish-to-api/");

  if (loading) {
    return <LoadingBar />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  async function publishToApi() {
    const confirm = await openConfirmation(
      "Publish dates to API?",
      "All parks that are not flagged will be made public. This cannot be undone.",
      "Publish",
      "Cancel",
      "Publishing may take up to one hour.",
    );

    if (confirm) {
      await publishData();

      openFlashMessage(
        "Dates publishing to API",
        "Approved dates publishing may take up to one hour.",
      );
    }
  }

  return (
    <div className="page publish">
      <FlashMessage
        title={flashTitle}
        message={flashMessage}
        isVisible={isFlashOpen}
        onClose={handleFlashClose}
      />
      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={title}
        message={message}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        notes={confirmationDialogNotes}
      />
      <div className="d-flex justify-content-end mb-2">
        <button className="btn btn-primary" onClick={publishToApi}>
          Publish to API
        </button>
        {saving && (
          <span
            className="spinner-border text-primary align-self-center me-2"
            aria-hidden="true"
          ></span>
        )}
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Park name</th>
              <th scope="col">Feature</th>
              <th scope="col">Season</th>
            </tr>
          </thead>
          <tbody>
            {data?.features.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.park.name}</td>
                <td>{feature.name}</td>
                <td>
                  {feature.season}
                  <NotReadyFlag show={!feature.readyToPublish} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PublishPage;
