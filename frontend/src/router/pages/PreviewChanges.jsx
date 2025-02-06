import PropTypes from "prop-types";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApiGet, useApiPost } from "@/hooks/useApi";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useConfirmation } from "@/hooks/useConfirmation";

import { faPen } from "@fa-kit/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import NavBack from "@/components/NavBack";
import FeatureIcon from "@/components/FeatureIcon";
import LoadingBar from "@/components/LoadingBar";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import FlashMessage from "@/components/FlashMessage";
import DateRange from "@/components/DateRange";
import ChangeLogsList from "@/components/ChangeLogsList";
import ConfirmationDialog from "@/components/ConfirmationDialog";

import { Link } from "react-router-dom";

import "./PreviewChanges.scss";

function PreviewChanges() {
  const { parkId, seasonId } = useParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");
  const [readyToPublish, setReadyToPublish] = useState(false);

  const {
    flashTitle,
    flashMessage,
    openFlashMessage,
    handleFlashClose,
    isFlashOpen,
  } = useFlashMessage();

  const { data, loading, error, fetchData } = useApiGet(`/seasons/${seasonId}`);

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
    openConfirmation,
    handleConfirm,
    handleCancel,
    isConfirmationOpen,
  } = useConfirmation();

  function hasChanges() {
    return notes !== "";
  }

  useNavigationGuard(hasChanges, openConfirmation);

  function navigateToEdit() {
    navigate(`/park/${parkId}/edit/${seasonId}`);
  }

  function getPrevSeasonDates(feature, dateType) {
    const dates = feature.dateable.previousSeasonDates.filter(
      (dateRange) => dateRange.dateType.name === dateType,
    );

    if (dates.length === 0) {
      return "Not available";
    }
    return dates.map((date) => (
      <DateRange key={date.id} start={date.startDate} end={date.endDate} />
    ));
  }

  function getCurrentSeasonDates(feature, dateType) {
    if (!feature.active) {
      return "Not requested";
    }

    const dates = feature.dateable.currentSeasonDates.filter(
      (dateRange) => dateRange.dateType.name === dateType,
    );

    return dates.map((dateRange) => (
      <DateRange
        key={dateRange.id}
        start={dateRange.startDate}
        end={dateRange.endDate}
      />
    ));
  }

  async function savePreview() {
    await saveData({
      notes,
      dates: [],
      readyToPublish,
    });
    setNotes("");
    fetchData();
    openFlashMessage(
      "Dates saved as draft",
      `${data?.park.name} ${data?.featureType.name} ${data?.operatingYear} season details saved`,
    );
  }

  async function approve() {
    await approveData({
      notes,
      readyToPublish,
    });

    // Redirect back to the Park Details page on success.
    // Use the "approved" query param to show a flash message.
    navigate(`/park/${parkId}?approved=${data.id}`);
  }

  function Feature({ feature }) {
    return (
      <div>
        {feature.name !== "" && <h5>{feature.name}</h5>}
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col" className="type-column">
                  Type of date
                </th>
                <th scope="col" className="prev-date-column">
                  {data?.operatingYear - 1}
                </th>
                <th scope="col" className="current-date-column">
                  {data?.operatingYear}
                </th>
                <th scope="col" className="actions-column"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Operating</td>
                <td>{getPrevSeasonDates(feature, "Operation")}</td>
                <td>{getCurrentSeasonDates(feature, "Operation")}</td>
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
                  <td>{getPrevSeasonDates(feature, "Reservation")}</td>
                  <td>{getCurrentSeasonDates(feature, "Reservation")}</td>
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

  function Campground({ campground }) {
    return (
      <div>
        <h4>{campground.name}</h4>

        {campground.features.map((feature) => (
          <Feature key={feature.id} feature={feature} />
        ))}
      </div>
    );
  }

  // add proptypes with shape
  Campground.propTypes = {
    campground: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.object),
    }),
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
    <div className="page review-changes">
      <FlashMessage
        title={flashTitle}
        message={flashMessage}
        isVisible={isFlashOpen}
        onClose={handleFlashClose}
      />

      <ConfirmationDialog
        title={title}
        message={message}
        notes={confirmationDialogNotes}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        isOpen={isConfirmationOpen}
      />

      <NavBack routePath={`/park/${parkId}/edit/${seasonId}`}>
        Back to {data?.park.name} dates
      </NavBack>

      <header className="page-header internal">
        <h1>
          {data?.park.name} {data?.operatingYear} season dates preview
        </h1>
      </header>

      <section className="feature-type">
        <h2 className="header-with-icon">
          <FeatureIcon iconName={data?.featureType.icon} />
          {data?.featureType.name}
        </h2>

        {data?.campgrounds.map((campground) => (
          <Campground key={campground.id} campground={campground} />
        ))}

        {data?.features.map((feature) => (
          <Feature key={feature.id} feature={feature} />
        ))}
      </section>

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

          <div className="controls d-flex mt-4">
            <Link
              to={`/park/${parkId}/edit/${seasonId}`}
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
