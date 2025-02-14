import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApiGet, useApiPost } from "@/hooks/useApi";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useMissingDatesConfirmation } from "@/hooks/useMissingDatesConfirmation";

import { faPen } from "@fa-kit/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import NavBack from "@/components/NavBack";
import FeatureIcon from "@/components/FeatureIcon";
import LoadingBar from "@/components/LoadingBar";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import DateRange from "@/components/DateRange";
import ChangeLogsList from "@/components/ChangeLogsList";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import MissingDatesConfirmationDialog from "@/components/MissingDatesConfirmationDialog";

import { Link } from "react-router-dom";

import "./PreviewChanges.scss";

function PreviewChanges() {
  const { parkId, seasonId } = useParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");
  const [readyToPublish, setReadyToPublish] = useState(false);

  const { data, loading, error } = useApiGet(`/winter-fees/${seasonId}`);

  const {
    sendData: saveData,
    // error: saveError, // @TODO: handle save errors
    loading: saving,
  } = useApiPost(`/seasons/${seasonId}/save/`);

  const { sendData: approveData, loading: savingApproval } = useApiPost(
    `/seasons/${seasonId}/approve/`,
  );

  const {
    title,
    message,
    confirmationDialogNotes,
    confirmButtonText,
    cancelButtonText,
    openConfirmation,
    handleConfirm,
    handleCancel,
    isConfirmationOpen,
  } = useConfirmation();

  const missingDatesConfirmation = useMissingDatesConfirmation();

  function hasChanges() {
    return notes !== "";
  }

  useNavigationGuard(hasChanges, openConfirmation);

  function navigateToEdit() {
    navigate(`/park/${parkId}/winter-fees/${seasonId}/edit`);
  }

  function getDates(dates) {
    if (dates.length === 0) {
      return "Not available";
    }
    return dates.map((date) => (
      <DateRange
        key={date.id}
        formatWithYear={true}
        start={date.startDate}
        end={date.endDate}
      />
    ));
  }

  async function savePreview() {
    await saveData({
      notes,
      dates: [],
      readyToPublish,
    });

    navigate(`/park/${parkId}?saved=${data.id}`);
  }

  function getFeaturesWithMissingDates() {
    const features = data.featureTypes.flatMap((featureType) =>
      featureType.features.filter(
        (feature) => feature.currentWinterDates.length === 0,
      ),
    );

    return features.map((feature) => feature.name);
  }

  async function approve() {
    const featuresWithMissingDates = getFeaturesWithMissingDates();

    if (featuresWithMissingDates.length > 0) {
      const { confirm, confirmationMessage } =
        await missingDatesConfirmation.openConfirmation(
          featuresWithMissingDates,
        );

      if (confirm) {
        await approveData({
          notes: [notes, confirmationMessage],
          readyToPublish,
        });

        missingDatesConfirmation.setInputMessage("");
        // Redirect back to the Park Details page on success.
        // Use the "approved" query param to show a flash message.
        navigate(`/park/${parkId}?approved=${data.id}`);
      }
    } else {
      await approveData({
        notes: [notes],
        readyToPublish,
      });
      // Redirect back to the Park Details page on success.
      // Use the "approved" query param to show a flash message.
      navigate(`/park/${parkId}?approved=${data.id}`);
    }
  }

  function Feature({ feature }) {
    return (
      <div>
        <h5>{feature.name}</h5>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col" className="type-column">
                  Type of date
                </th>
                <th scope="col" className="prev-date-column">
                  {data.previousSeasonName}
                </th>
                <th scope="col" className="current-date-column">
                  {data.name}
                </th>
                <th scope="col" className="actions-column"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Winter fee</td>
                <td>{getDates(feature.previousWinterDates)}</td>
                <td>{getDates(feature.currentWinterDates)}</td>
                <td>
                  <button
                    onClick={navigateToEdit}
                    className="btn btn-text-primary"
                  >
                    <FontAwesomeIcon
                      className="append-content me-2"
                      icon={faPen}
                    />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>

              {feature.hasReservations && (
                <tr>
                  <td>Reservation</td>
                  <td>{getDates(feature.previousReservationDates)}</td>
                  <td>{getDates(feature.currentReservationDates)}</td>
                  <td>{/* Don't show edit link for reservation dates */}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  Feature.propTypes = {
    feature: PropTypes.object,
  };

  useEffect(() => {
    if (!data) {
      return;
    }

    setReadyToPublish(data.readyToPublish);
  }, [data]);

  if (loading) {
    return <LoadingBar />;
  }

  if (error) {
    return <p>Error loading season data: {error.message}</p>;
  }

  return (
    <div className="page review-winter-fees-changes">
      <ConfirmationDialog
        title={title}
        message={message}
        notes={confirmationDialogNotes}
        confirmButtonText={confirmButtonText}
        cancelButtonText={cancelButtonText}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        isOpen={isConfirmationOpen}
      />

      <MissingDatesConfirmationDialog
        featureNames={missingDatesConfirmation.featureNames}
        inputMessage={missingDatesConfirmation.inputMessage}
        setInputMessage={missingDatesConfirmation.setInputMessage}
        isOpen={missingDatesConfirmation.isOpen}
        onCancel={missingDatesConfirmation.handleCancel}
        onConfirm={missingDatesConfirmation.handleConfirm}
      />

      <NavBack routePath={`/park/${parkId}`}>
        Back to {data?.park.name} dates
      </NavBack>

      <header className="page-header internal">
        <h1 className="header-with-icon">
          <FeatureIcon iconName="winter-recreation" />
          {data.park.name} winter fee
        </h1>
        <h2>Preview {data.name}</h2>
      </header>

      {data?.featureTypes.map((featureType) => (
        <section key={featureType.id} className="feature-type">
          <h3 className="header-with-icon">
            <FeatureIcon iconName={featureType.icon} />
            {featureType.name}
          </h3>

          {featureType.features.map((feature) => (
            <Feature key={feature.id} feature={feature} />
          ))}
        </section>
      ))}

      <div className="row notes">
        <div className="col-lg-6">
          <h2 className="mb-4">Notes</h2>

          <ChangeLogsList changeLogs={data?.changeLogs} />

          <p>
            If you are updating the current year’s dates, provide an explanation
            for why dates have changed. Provide any other notes about these
            dates if needed.
          </p>

          <div className="form-group mb-4">
            <textarea
              className="form-control"
              id="notes"
              name="notes"
              rows="5"
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
            ></textarea>
          </div>
          <ContactBox />

          <ReadyToPublishBox
            readyToPublish={readyToPublish}
            setReadyToPublish={setReadyToPublish}
          />

          <div className="controls d-flex flex-column flex-sm-row gap-2">
            <Link
              to={`/park/${parkId}/winter-fees/${seasonId}/edit`}
              type="button"
              className="btn btn-outline-primary"
            >
              Back
            </Link>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={savePreview}
            >
              Save draft
            </button>

            <button type="button" className="btn btn-primary" onClick={approve}>
              Mark approved
            </button>

            {(saving || savingApproval) && (
              <span
                className="spinner-border text-primary align-self-center me-2"
                aria-hidden="true"
              ></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewChanges;
