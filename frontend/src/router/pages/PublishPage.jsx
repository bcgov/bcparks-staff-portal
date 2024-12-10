import { useConfirmation } from "@/hooks/useConfirmation";
import { useFlashMessage } from "@/hooks/useFlashMessage";

import ConfirmationDialog from "@/components/ConfirmationDialog";
import FlashMessage from "@/components/FlashMessage";

function PublishPage() {
  const {
    title,
    message,
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

  function publishToApi() {
    openConfirmation(
      "Publish dates to API?",
      "All parks that are not flagged will be made public. This cannot be undone.",
      () => {
        openFlashMessage(
          "Dates publishing to API",
          "Approved dates publishing may take up to one hour.",
        );
      },
      "Publishing may take up to one hour.",
    );
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
        notes={confirmationDialogNotes}
      />
      <div className="d-flex justify-content-end mb-2">
        <button className="btn btn-primary" onClick={publishToApi}>
          Publish to API
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th scope="col">Park name</th>
              <th scope="col">Feature</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Golden Ears</td>
              <td className="fw-bold">Alouette Campground</td>
            </tr>
            <tr>
              <td>Golden Ears</td>
              <td className="fw-bold">Gold Creek Campground</td>
            </tr>
            <tr>
              <td>Golden Ears</td>
              <td className="fw-bold">North Beach Campground</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PublishPage;
