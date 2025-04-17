import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { useOutletContext } from "react-router-dom";
import { useApiPost } from "@/hooks/useApi";
import { useMissingDatesConfirmation } from "@/hooks/useMissingDatesConfirmation";
import useAccess from "@/hooks/useAccess";
import paths from "@/router/paths";

import { faPen } from "@fa-kit/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import NavBack from "@/components/NavBack";
import FeatureIcon from "@/components/FeatureIcon";
import ContactBox from "@/components/ContactBox";
import ReadyToPublishBox from "@/components/ReadyToPublishBox";
import DateRange from "@/components/DateRange";
import ChangeLogsList from "@/components/ChangeLogsList";
import MissingDatesConfirmationDialog from "@/components/MissingDatesConfirmationDialog";

import "./PreviewChanges.scss";

function PreviewChanges({ review = false }) {
  const {
    parkId,
    seasonId,
    season,
    dates,
    notes,
    setNotes,
    readyToPublish,
    setReadyToPublish,
    navigate,
    navigateAndScroll,
    saveAsDraft,
    saveChanges,
    showErrorFlash,
    hasChanges,
    saving,
  } = useOutletContext();

 const { ROLES, checkAccess } = useAccess();

  // Check if the user has permission to approve the season
  const approver = useMemo(
    () => checkAccess(ROLES.APPROVER),
    [checkAccess, ROLES.APPROVER],
  );

  const navigateToEdit = useCallback(
    (anchor = null) => {
      let anchorId;

      // If the anchor is provided, scroll to the specific date type
      if (anchor?.dateType && anchor?.featureId) {
        anchorId = `${anchor.dateType}-dates-${anchor.featureId}`;
      }

      navigateAndScroll(paths.winterFeesEdit(parkId, seasonId), anchorId);
    },
    [parkId, seasonId, navigateAndScroll],
  );

  const { sendData: approveData, loading: savingApproval } = useApiPost(
    `/seasons/${seasonId}/approve/`,
  );

  const { sendData: submitData, loading: sendingSubmit } = useApiPost(
    `/seasons/${seasonId}/submit-for-approval/`,
  );

  const missingDatesConfirmation = useMissingDatesConfirmation();

  function getDates(featureDates) {
    if (featureDates.length === 0) {
      return "Not available";
    }
    return featureDates.map((date) => (
      <DateRange
        key={date.id || date.tempId}
        formatWithYear={true}
        start={date.startDate}
        end={date.endDate}
      />
    ));
  }

  // Returns the names of features with no (or null) date ranges
  function getFeaturesWithMissingDates() {
    const allFeatures = season.featureTypes.flatMap(
      (featureType) => featureType.features,
    );

    // Get dateable IDs with no associated dates (or null date ranges)
    const dateableIds = Object.entries(dates).filter(([, featureDates]) =>
      featureDates.every(
        (featureDate) =>
          featureDate.startDate === null && featureDate.endDate === null,
      ),
    );

    const featureNames = dateableIds.map(([dateableId]) => {
      const feature = allFeatures.find(
        (f) => f.dateableId === Number(dateableId),
      );

      return feature.name;
    });

    return featureNames;
  }

  // Navigate back to the previous page
  function onBackButtonClick() {
    // On the Review page, go back to the Park Details page
    if (review) {
      navigate(paths.park(parkId));
      return;
    }

    // On the Preview page, go back to the Edit page
    navigateAndScroll(paths.winterFeesEdit(parkId, seasonId));
  }

  /**
   * Saves and sends the data to the API with the given POST function.
   * @param {Function} postFunction Function to call to POST the data.
   * @param {string|Object} redirectTo Router `to` object or string to redirect to.
   * @returns {Promise<void>}
   */
  async function saveAndPost(postFunction, redirectTo) {
    const featuresWithMissingDates = getFeaturesWithMissingDates();

    try {
      // Save changes first, if necessary
      if (hasChanges) {
        await saveChanges();
      }

      if (featuresWithMissingDates.length > 0) {
        const { confirm, confirmationMessage } =
          await missingDatesConfirmation.openConfirmation(
            featuresWithMissingDates,
          );

        if (confirm) {
          await postFunction({
            notes: [confirmationMessage],
            readyToPublish,
          });

          missingDatesConfirmation.setInputMessage("");
          // Redirect back to the Park Details page on success.
          // Use the "approved" query param to show a flash message.
          navigate(redirectTo);
        }
      } else {
        await postFunction({
          notes: [], // Notes were saved with saveChanges,
          readyToPublish,
        });
        // Redirect back to the Park Details page on success.
        // Use the "approved" query param to show a flash message.
        navigate(redirectTo);
      }
    } catch (err) {
      console.error("Error approving preview", err);

      showErrorFlash();
    }
  }

  // Saves and approves the changes
  async function approve() {
    return saveAndPost(approveData, {
      pathname: paths.park(parkId),
      search: `?approved=${seasonId}`,
    });
  }

  // Saves and submits the changes for review
  async function submitForApproval() {
    return saveAndPost(submitData, {
      pathname: paths.park(parkId),
      search: `?submitted=${seasonId}`,
    });
  }

  function Feature({ feature }) {
    // Get edited dates from `dates` (instead of the original dates in `season`)
    const currentWinterDates = dates[feature.dateableId] ?? [];

    return (
      <div>
        <h4 className="feature-name mb-4">{feature.name}</h4>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col" className="type-column">
                  Type of date
                </th>
                <th scope="col" className="prev-date-column">
                  {season.previousSeasonName}
                </th>
                <th scope="col" className="current-date-column">
                  {season.name}
                </th>
                <th scope="col" className="actions-column"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Winter fee</td>
                <td>{getDates(feature.previousWinterDates)}</td>
                <td>{getDates(currentWinterDates)}</td>
                <td>
                  <button
                    onClick={() =>
                      navigateToEdit({
                        dateType: "Winter-fee",
                        featureId: feature.id,
                      })
                    }
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

  return (
    <div className="container">
      <div className="page review-winter-fees-changes">
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
            <FeatureIcon iconName="winter-recreation" />
            {season.park.name} winter fee
          </h1>
          <h2>
            {review ? "Review" : "Preview"} {season.name}
          </h2>
        </header>

        {season?.featureTypes.map((featureType) => (
          <section key={featureType.id} className="feature-type">
            <h3 className="header-with-icon mb-4">
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

            {approver && (
              <ReadyToPublishBox
                readyToPublish={readyToPublish}
                setReadyToPublish={setReadyToPublish}
              />
            )}
          </div>
        </div>

        <div className="controls d-flex flex-column flex-sm-row gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={onBackButtonClick}
          >
            Back
          </button>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={saveAsDraft}
            disabled={!hasChanges}
          >
            Save draft
          </button>

          {approver && (
            <button type="button" className="btn btn-primary" onClick={approve}>
              Mark approved
            </button>
          )}

          {!approver && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={submitForApproval}
            >
              Submit for approval
            </button>
          )}

          {(saving || savingApproval || sendingSubmit) && (
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

PreviewChanges.propTypes = {
  // Boolean flag for Review mode (display different titles and buttons)
  // Otherwise, default to Preview mode (for editing/submitters)
  review: PropTypes.bool,
};

export default PreviewChanges;
