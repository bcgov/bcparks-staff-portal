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

  async function publishToApi() {
    const confirm = await openConfirmation(
      "Publish dates to API?",
      "All parks that are not flagged will be made public. This cannot be undone.",
      "Publishing may take up to one hour.",
    );

    if (confirm) {
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
            {data?.features.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.park.name}</td>
                <td>{feature.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PublishPage;
