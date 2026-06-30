import PropTypes from "prop-types";
import { groupBy, orderBy, partition, uniqBy } from "lodash-es";
import { useCallback, useMemo } from "react";

/**
 * Scrolls the page to reveal the validation error slot for the given element ID.
 * @param {string} errorId The validation element ID to scroll to
 * @returns {void}
 */
function scrollToError(errorId) {
  // Find the error message element in the DOM by its error ID
  const errorElement = document.querySelector(
    `[data-error-slot-id="${errorId}"]`,
  );

  if (errorElement) {
    errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Displays a list of validation errors, with links to scroll the fields into view
function ErrorList({ errors }) {
  // Sort the output alphabetically
  const sortedErrors = useMemo(
    () => orderBy(errors, ["name", "message"], ["asc", "asc"]),
    [errors],
  );

  return (
    <ul>
      {sortedErrors.map((error) => (
        <li key={`${error.id}-${error.message}`}>
          <button
            type="button"
            onClick={() => scrollToError(error.id)}
            className="btn btn-text text-decoration-underline p-0 text-start align-top"
          >
            {error.name}: {error.message}
          </button>
        </li>
      ))}
    </ul>
  );
}

ErrorList.propTypes = {
  errors: PropTypes.array.isRequired,
};

export default function FormErrorSummary({
  multipleFeatures = false,
  errors,
  dateableNameMap,
}) {
  const numErrors = uniqBy(errors, "id").length;

  const headline =
    numErrors === 1
      ? "There is 1 entry that may be incorrect"
      : `There are ${numErrors} entries that may be incorrect`;

  const [featureErrors, formErrors] = partition(
    errors,
    (error) => error.dateableId,
  );

  const getFeatureName = useCallback(
    (dateableId) => dateableNameMap.get(dateableId) || "",
    [dateableNameMap],
  );

  const groupedFeatureErrors = useMemo(() => {
    // For Park- and Feature-level forms, we don't need this variable.
    if (!multipleFeatures) return [];

    // For ParkArea-level forms with multiple features, group errors by the Feature's DateableId
    const groupedErrors = groupBy(featureErrors, "dateableId");
    const groupedByName = Object.entries(groupedErrors).map(
      ([dateableId, errorsArray]) => ({
        name: getFeatureName(Number(dateableId)),
        errors: errorsArray,
        dateableId, // for template keys
      }),
    );

    return groupedByName;
  }, [multipleFeatures, featureErrors, getFeatureName]);

  return (
    <div
      className="alert alert-danger fade show px-5 py-4 text-black"
      role="alert"
    >
      <h3 className="h5">{headline}</h3>

      {multipleFeatures &&
        groupedFeatureErrors.map((feature) => (
          <div key={feature.dateableId} className="mb-2">
            <div className="fw-bold mb-1">{feature.name}</div>
            <ErrorList errors={feature.errors} />
          </div>
        ))}

      {!multipleFeatures && featureErrors.length > 0 && (
        <div className="mb-2">
          <ErrorList errors={featureErrors} />
        </div>
      )}

      {formErrors.length > 0 && (
        <>
          {featureErrors.length > 0 && <hr />}

          <div className="mb-2">
            <ErrorList errors={formErrors} />
          </div>
        </>
      )}

      <p className="mb-0">
        Please review the dates to ensure they are correct, and revise them if
        needed. If you’ve confirmed the information is correct, proceed to
        submit anyway.
      </p>
    </div>
  );
}

// Prop types
FormErrorSummary.propTypes = {
  multipleFeatures: PropTypes.bool,
  errors: PropTypes.array.isRequired,
  dateableNameMap: PropTypes.instanceOf(Map).isRequired,
};
