import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import { useApiPost } from "@/hooks/useApi";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useMissingDatesConfirmation } from "@/hooks/useMissingDatesConfirmation";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import paths from "@/router/paths";

import { faPen } from "@fa-kit/icons/classic/solid";
import { faHexagonExclamation } from "@fa-kit/icons/classic/regular";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import NavBack from "@/components/NavBack";
import FeatureIcon from "@/components/FeatureIcon";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import DateRange from "@/components/DateRange";
import ChangeLogsList from "@/components/ChangeLogsList";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import MissingDatesConfirmationDialog from "@/components/MissingDatesConfirmationDialog";
import FlashMessage from "@/components/FlashMessage";

import "./PreviewChanges.scss";

function PreviewChanges() {
  const {
    parkId,
    seasonId,
    season,
    notes,
    setNotes,
    readyToPublish,
    setReadyToPublish,
    validation,
    navigate,
    navigateAndScroll,
  } = useOutletContext();

  const { sendData: saveData, loading: saving } = useApiPost(
    `/seasons/${seasonId}/save/`,
  );

  const { sendData: approveData, loading: savingApproval } = useApiPost(
    `/seasons/${seasonId}/approve/`,
  );

  const errorFlashMessage = useFlashMessage();

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

  const missingDatesConfirmation = useMissingDatesConfirmation();

  function hasChanges() {
    return notes !== "" || season.readyToPublish !== readyToPublish;
  }

  useNavigationGuard(hasChanges, openConfirmation);

  function navigateToEdit() {
    navigateAndScroll(paths.seasonEdit(parkId, seasonId));
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

  function showErrorFlash() {
    errorFlashMessage.openFlashMessage(
      "Unable to save changes",
      "There was a problem saving these changes. Please try again.",
    );
  }

  async function savePreview() {
    try {
      await saveData({
        notes,
        dates: [],
        readyToPublish,
        deletedDateRangeIds: [],
      });

      navigate(`${paths.park(parkId)}?saved=${seasonId}`);
    } catch (err) {
      console.error("Error saving preview", err);

      showErrorFlash();
    }
  }

  function getFeaturesWithMissingDates() {
    const featureNameList = [];

    season?.campgrounds.forEach((campground) => {
      campground.features.forEach((feature) => {
        if (feature.active) {
          const operatingDates = feature.dateable.currentSeasonDates.filter(
            (dateRange) =>
              dateRange.dateType.name === "Operation" &&
              dateRange.startDate &&
              dateRange.endDate,
          );

          if (operatingDates.length === 0) {
            const name =
              feature.name === "All sites"
                ? campground.name
                : `${campground.name}: ${feature.name}`;

            featureNameList.push(`${name} operating dates`);
          }

          if (feature.hasReservations) {
            const reservationDates = feature.dateable.currentSeasonDates.filter(
              (dateRange) =>
                dateRange.dateType.name === "Reservation" &&
                dateRange.startDate &&
                dateRange.endDate,
            );

            if (reservationDates.length === 0) {
              const name =
                feature.name === "All sites"
                  ? campground.name
                  : `${campground.name}: ${feature.name}`;

              featureNameList.push(`${name} reservation dates`);
            }
          }
        }
      });
    });

    season?.features.forEach((feature) => {
      if (feature.active) {
        const operatingDates = feature.dateable.currentSeasonDates.filter(
          (dateRange) =>
            dateRange.dateType.name === "Operation" &&
            dateRange.startDate &&
            dateRange.endDate,
        );

        if (operatingDates.length === 0) {
          featureNameList.push(`${feature.name} operating dates`);
        }

        if (feature.hasReservations) {
          const reservationDates = feature.dateable.currentSeasonDates.filter(
            (dateRange) =>
              dateRange.dateType.name === "Reservation" &&
              dateRange.startDate &&
              dateRange.endDate,
          );

          if (reservationDates.length === 0) {
            featureNameList.push(`${feature.name} reservation dates`);
          }
        }
      }
    });

    return featureNameList;
  }

  async function approve() {
    validation.formSubmitted.current = true;

    if (!validation.validateForm()) {
      throw new validation.ValidationError("Form validation failed");
    }

    const featuresWithMissingDates = getFeaturesWithMissingDates();

    try {
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
          navigate(`${paths.park(parkId)}?approved=${seasonId}`);
        }
      } else {
        await approveData({
          notes: [notes],
          readyToPublish,
        });
        // Redirect back to the Park Details page on success.
        // Use the "approved" query param to show a flash message.
        navigate(`${paths.park(parkId)}?approved=${seasonId}`);
      }
    } catch (err) {
      console.error("Error approving preview", err);

      if (err instanceof validation.ValidationError) {
        // @TODO: Handle validation errors
        console.error(err);
      } else {
        // Show a flash message for fatal server errors
        showErrorFlash();
      }
    }
  }

  function Feature({ feature }) {
    return (
      <div>
        {feature.name !== "" && (
          <h4 className="feature-name mb-4">{feature.name}</h4>
        )}
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col" className="type-column">
                  Type of date
                </th>
                <th scope="col" className="prev-date-column">
                  {season?.operatingYear - 1}
                </th>
                <th scope="col" className="current-date-column">
                  {season?.operatingYear}
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
                    className="btn btn-text text-primary"
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
                      className="btn btn-text text-primary"
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
        <h3 className="campground-name mb-4">{campground.name}</h3>

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

  return (
    <div className="container">
      <div className="page review-changes">
        <FlashMessage
          title={errorFlashMessage.flashTitle}
          message={errorFlashMessage.flashMessage}
          isVisible={errorFlashMessage.isFlashOpen}
          onClose={errorFlashMessage.handleFlashClose}
          variant="error"
        />

        <ConfirmationDialog
          title={title}
          message={message}
          confirmButtonText={confirmButtonText}
          cancelButtonText={cancelButtonText}
          notes={confirmationDialogNotes}
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

        <NavBack routePath={paths.park(parkId)}>
          Back to {season?.park.name} dates
        </NavBack>

        <header className="page-header internal">
          <h1 className="header-with-icon">
            <FeatureIcon iconName={season.featureType.icon} />
            {season.park.name} {season.featureType.name}
          </h1>
          <h2>Preview {season.operatingYear} dates</h2>
        </header>

        <section className="feature-type">
          {season?.campgrounds.map((campground) => (
            <Campground key={campground.id} campground={campground} />
          ))}

          {season?.features.map((feature) => (
            <Feature key={feature.id} feature={feature} />
          ))}
        </section>

        <div className="row notes">
          <div className="col-lg-6">
            <h3 className="mb-4">Notes</h3>

            <ChangeLogsList changeLogs={season?.changeLogs} />

            <p>
              If you are updating the current year’s dates, provide an
              explanation for why dates have changed. Provide any other notes
              about these dates if needed.
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

            {validation.isValid === false && (
              <div
                className="alert alert-danger alert-validation-error mb-4"
                role="alert"
              >
                <div className="icon">
                  <FontAwesomeIcon icon={faHexagonExclamation} />{" "}
                </div>

                <div className="content">Please fix errors to continue</div>
              </div>
            )}
          </div>
        </div>

        <div className="controls d-flex flex-column flex-sm-row gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={navigateToEdit}
          >
            Back
          </button>

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
  );
}

export default PreviewChanges;
