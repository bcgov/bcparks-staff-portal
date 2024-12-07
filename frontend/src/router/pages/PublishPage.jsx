import { useConfirmation } from "@/hooks/useConfirmation";
import ConfirmationDialog from "@/components/ConfirmationDialog";

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

  function publishToApi() {
    openConfirmation(
      "Publish dates to API?",
      "All parks that are not flagged will be made public. This cannot be undone.",
      () => {
        console.log("Publishing to API");
      },
      "Publishing may take up to one hour.",
    );
  }

  return (
    <div className="page publish">
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
